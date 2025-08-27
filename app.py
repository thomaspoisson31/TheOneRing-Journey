
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
import sqlite3
import json
import os
from datetime import datetime
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)  # Générer une clé secrète aléatoirement

# Configuration de la base de données
DATABASE = 'travel_contexts.db'

def init_db():
    """Initialiser la base de données avec les tables nécessaires"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Table des utilisateurs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            replit_user_id TEXT UNIQUE NOT NULL,
            email TEXT,
            name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Table des contextes de voyage
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS travel_contexts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            data_json TEXT NOT NULL,
            shared BOOLEAN DEFAULT 0,
            share_token TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Table de l'usage API
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            endpoint TEXT,
            tokens_used INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Obtenir une connexion à la base de données"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def get_or_create_user(replit_user_id, name=None, email=None):
    """Obtenir ou créer un utilisateur basé sur l'ID Replit"""
    conn = get_db_connection()
    
    user = conn.execute(
        'SELECT * FROM users WHERE replit_user_id = ?', 
        (replit_user_id,)
    ).fetchone()
    
    if user is None:
        # Créer un nouvel utilisateur
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (replit_user_id, name, email) VALUES (?, ?, ?)',
            (replit_user_id, name, email)
        )
        user_id = cursor.lastrowid
        conn.commit()
        
        user = conn.execute(
            'SELECT * FROM users WHERE id = ?', 
            (user_id,)
        ).fetchone()
    
    conn.close()
    return dict(user)

@app.route('/')
def index():
    """Page principale - sert l'interface existante"""
    return send_from_directory('.', 'index.html')

@app.route('/api/auth/user')
def get_current_user():
    """Obtenir les informations de l'utilisateur actuel via les headers Replit"""
    user_id = request.headers.get('X-Replit-User-Id')
    user_name = request.headers.get('X-Replit-User-Name')
    
    if user_id:
        # Utilisateur authentifié via Replit
        user = get_or_create_user(user_id, user_name)
        session['user_id'] = user['id']
        return jsonify({
            'authenticated': True,
            'user': user
        })
    else:
        # Utilisateur non authentifié
        return jsonify({
            'authenticated': False,
            'user': None
        })

@app.route('/api/contexts', methods=['GET'])
def get_contexts():
    """Obtenir les contextes de voyage de l'utilisateur"""
    if 'user_id' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    
    conn = get_db_connection()
    contexts = conn.execute(
        'SELECT id, name, created_at, updated_at, shared FROM travel_contexts WHERE user_id = ? ORDER BY updated_at DESC',
        (session['user_id'],)
    ).fetchall()
    conn.close()
    
    return jsonify([dict(ctx) for ctx in contexts])

@app.route('/api/contexts', methods=['POST'])
def save_context():
    """Sauvegarder un nouveau contexte de voyage"""
    if 'user_id' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    
    data = request.json
    name = data.get('name', 'Contexte sans nom')
    context_data = data.get('data', {})
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO travel_contexts (user_id, name, data_json, updated_at) VALUES (?, ?, ?, ?)',
        (session['user_id'], name, json.dumps(context_data), datetime.now())
    )
    context_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': context_id, 'message': 'Contexte sauvegardé avec succès'})

@app.route('/api/contexts/<int:context_id>', methods=['GET'])
def get_context(context_id):
    """Obtenir un contexte de voyage spécifique"""
    conn = get_db_connection()
    
    # Vérifier si c'est un contexte partagé ou appartenant à l'utilisateur
    if 'user_id' in session:
        context = conn.execute(
            'SELECT * FROM travel_contexts WHERE id = ? AND (user_id = ? OR shared = 1)',
            (context_id, session['user_id'])
        ).fetchone()
    else:
        # Contexte partagé seulement
        context = conn.execute(
            'SELECT * FROM travel_contexts WHERE id = ? AND shared = 1',
            (context_id,)
        ).fetchone()
    
    conn.close()
    
    if context is None:
        return jsonify({'error': 'Contexte non trouvé'}), 404
    
    context_dict = dict(context)
    context_dict['data'] = json.loads(context_dict['data_json'])
    del context_dict['data_json']
    
    return jsonify(context_dict)

@app.route('/api/contexts/<int:context_id>', methods=['PUT'])
def update_context(context_id):
    """Mettre à jour un contexte de voyage"""
    if 'user_id' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    
    data = request.json
    name = data.get('name')
    context_data = data.get('data')
    
    conn = get_db_connection()
    
    # Vérifier que le contexte appartient à l'utilisateur
    context = conn.execute(
        'SELECT * FROM travel_contexts WHERE id = ? AND user_id = ?',
        (context_id, session['user_id'])
    ).fetchone()
    
    if context is None:
        conn.close()
        return jsonify({'error': 'Contexte non trouvé ou accès refusé'}), 403
    
    # Mettre à jour
    cursor = conn.cursor()
    if name and context_data:
        cursor.execute(
            'UPDATE travel_contexts SET name = ?, data_json = ?, updated_at = ? WHERE id = ?',
            (name, json.dumps(context_data), datetime.now(), context_id)
        )
    elif name:
        cursor.execute(
            'UPDATE travel_contexts SET name = ?, updated_at = ? WHERE id = ?',
            (name, datetime.now(), context_id)
        )
    elif context_data:
        cursor.execute(
            'UPDATE travel_contexts SET data_json = ?, updated_at = ? WHERE id = ?',
            (json.dumps(context_data), datetime.now(), context_id)
        )
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Contexte mis à jour avec succès'})

@app.route('/api/contexts/<int:context_id>/share', methods=['POST'])
def share_context(context_id):
    """Partager un contexte de voyage"""
    if 'user_id' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    
    conn = get_db_connection()
    
    # Vérifier que le contexte appartient à l'utilisateur
    context = conn.execute(
        'SELECT * FROM travel_contexts WHERE id = ? AND user_id = ?',
        (context_id, session['user_id'])
    ).fetchone()
    
    if context is None:
        conn.close()
        return jsonify({'error': 'Contexte non trouvé ou accès refusé'}), 403
    
    # Générer un token de partage et activer le partage
    share_token = secrets.token_urlsafe(32)
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE travel_contexts SET shared = 1, share_token = ? WHERE id = ?',
        (share_token, context_id)
    )
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Contexte partagé avec succès',
        'share_token': share_token,
        'share_url': f'/shared/{share_token}'
    })

@app.route('/shared/<share_token>')
def view_shared_context(share_token):
    """Voir un contexte partagé"""
    conn = get_db_connection()
    context = conn.execute(
        'SELECT * FROM travel_contexts WHERE share_token = ? AND shared = 1',
        (share_token,)
    ).fetchone()
    conn.close()
    
    if context is None:
        return "Contexte partagé non trouvé", 404
    
    # Servir l'interface en mode lecture seule
    return send_from_directory('.', 'index.html')

# Routes pour servir les fichiers statiques existants
@app.route('/<path:filename>')
def serve_static(filename):
    """Servir les fichiers statiques (images, JSON, etc.)"""
    return send_from_directory('.', filename)

if __name__ == '__main__':
    init_db()
    print("🚀 Serveur Flask démarré avec base de données SQLite")
    print("📊 Base de données initialisée avec les tables users, travel_contexts, api_usage")
    print("🔑 Prêt pour l'authentification Replit et la gestion des contextes de voyage")
    app.run(host='0.0.0.0', port=5000, debug=True)
