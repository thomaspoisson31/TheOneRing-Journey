
import sqlite3
import json
from datetime import datetime
import secrets

DATABASE = 'travel_contexts.db'

class DatabaseManager:
    def __init__(self):
        self.database = DATABASE
    
    def get_connection(self):
        """Obtenir une connexion à la base de données"""
        conn = sqlite3.connect(self.database)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Initialiser la base de données avec toutes les tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Table des utilisateurs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                replit_user_id TEXT UNIQUE,
                google_id TEXT UNIQUE,
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
        
        # Table de l'usage API Gemini
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS api_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                endpoint TEXT,
                tokens_used INTEGER,
                cost_estimate REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Table des sessions utilisateur
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                session_token TEXT UNIQUE,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Base de données initialisée avec succès")
    
    def create_user(self, replit_user_id, name=None, email=None):
        """Créer un nouvel utilisateur"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (replit_user_id, name, email) VALUES (?, ?, ?)',
            (replit_user_id, name, email)
        )
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return user_id
    
    def get_user_by_replit_id(self, replit_user_id):
        """Obtenir un utilisateur par son ID Replit"""
        conn = self.get_connection()
        user = conn.execute(
            'SELECT * FROM users WHERE replit_user_id = ?',
            (replit_user_id,)
        ).fetchone()
        conn.close()
        return dict(user) if user else None
    
    def save_travel_context(self, user_id, name, data):
        """Sauvegarder un contexte de voyage"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO travel_contexts (user_id, name, data_json, updated_at) VALUES (?, ?, ?, ?)',
            (user_id, name, json.dumps(data), datetime.now())
        )
        context_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return context_id
    
    def get_user_contexts(self, user_id):
        """Obtenir tous les contextes de voyage d'un utilisateur"""
        conn = self.get_connection()
        contexts = conn.execute(
            'SELECT id, name, created_at, updated_at, shared FROM travel_contexts WHERE user_id = ? ORDER BY updated_at DESC',
            (user_id,)
        ).fetchall()
        conn.close()
        return [dict(ctx) for ctx in contexts]
    
    def get_context_by_id(self, context_id, user_id=None):
        """Obtenir un contexte par son ID"""
        conn = self.get_connection()
        
        if user_id:
            # Vérifier la propriété ou le partage
            context = conn.execute(
                'SELECT * FROM travel_contexts WHERE id = ? AND (user_id = ? OR shared = 1)',
                (context_id, user_id)
            ).fetchone()
        else:
            # Seulement les contextes partagés
            context = conn.execute(
                'SELECT * FROM travel_contexts WHERE id = ? AND shared = 1',
                (context_id,)
            ).fetchone()
        
        conn.close()
        
        if context:
            context_dict = dict(context)
            context_dict['data'] = json.loads(context_dict['data_json'])
            del context_dict['data_json']
            return context_dict
        return None
    
    def update_context(self, context_id, user_id, name=None, data=None):
        """Mettre à jour un contexte de voyage"""
        conn = self.get_connection()
        
        # Vérifier la propriété
        context = conn.execute(
            'SELECT * FROM travel_contexts WHERE id = ? AND user_id = ?',
            (context_id, user_id)
        ).fetchone()
        
        if not context:
            conn.close()
            return False
        
        cursor = conn.cursor()
        if name and data:
            cursor.execute(
                'UPDATE travel_contexts SET name = ?, data_json = ?, updated_at = ? WHERE id = ?',
                (name, json.dumps(data), datetime.now(), context_id)
            )
        elif name:
            cursor.execute(
                'UPDATE travel_contexts SET name = ?, updated_at = ? WHERE id = ?',
                (name, datetime.now(), context_id)
            )
        elif data:
            cursor.execute(
                'UPDATE travel_contexts SET data_json = ?, updated_at = ? WHERE id = ?',
                (json.dumps(data), datetime.now(), context_id)
            )
        
        conn.commit()
        conn.close()
        return True
    
    def share_context(self, context_id, user_id):
        """Partager un contexte de voyage"""
        conn = self.get_connection()
        
        # Vérifier la propriété
        context = conn.execute(
            'SELECT * FROM travel_contexts WHERE id = ? AND user_id = ?',
            (context_id, user_id)
        ).fetchone()
        
        if not context:
            conn.close()
            return None
        
        # Générer un token de partage
        share_token = secrets.token_urlsafe(32)
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE travel_contexts SET shared = 1, share_token = ? WHERE id = ?',
            (share_token, context_id)
        )
        conn.commit()
        conn.close()
        return share_token
    
    def log_api_usage(self, user_id, endpoint, tokens_used, cost_estimate=0.0):
        """Enregistrer l'usage de l'API Gemini"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO api_usage (user_id, endpoint, tokens_used, cost_estimate) VALUES (?, ?, ?, ?)',
            (user_id, endpoint, tokens_used, cost_estimate)
        )
        conn.commit()
        conn.close()
    
    def get_user_api_usage(self, user_id, days=30):
        """Obtenir l'usage API d'un utilisateur sur les derniers jours"""
        conn = self.get_connection()
        usage = conn.execute(
            '''SELECT endpoint, SUM(tokens_used) as total_tokens, SUM(cost_estimate) as total_cost, COUNT(*) as calls
               FROM api_usage 
               WHERE user_id = ? AND created_at >= datetime('now', '-{} days')
               GROUP BY endpoint'''.format(days),
            (user_id,)
        ).fetchall()
        conn.close()
        return [dict(row) for row in usage]
