
import unittest
from unittest.mock import patch, MagicMock
import json
import tempfile
import os
import sys

# Ajouter le répertoire parent au path pour importer app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, get_or_create_user, init_db, get_db_connection
from database import DatabaseManager

class TestBackendFunctions(unittest.TestCase):
    
    def setUp(self):
        """Configuration avant chaque test"""
        # Créer une base de données temporaire pour les tests
        self.test_db = tempfile.mktemp()
        os.environ['DATABASE'] = self.test_db
        
        # Configuration de test pour Flask
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test-secret-key'
        self.client = app.test_client()
        
        # Initialiser la base de données de test
        init_db()
    
    def tearDown(self):
        """Nettoyage après chaque test"""
        if os.path.exists(self.test_db):
            os.unlink(self.test_db)
    
    def test_database_initialization(self):
        """Test de l'initialisation de la base de données"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier que les tables existent
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        expected_tables = ['users', 'travel_contexts', 'api_usage']
        for table in expected_tables:
            self.assertIn(table, tables)
        
        conn.close()
    
    def test_get_or_create_user(self):
        """Test de création/récupération d'utilisateur"""
        # Créer un nouvel utilisateur
        user1 = get_or_create_user(
            google_id='test123',
            name='Test User',
            email='test@example.com'
        )
        
        self.assertEqual(user1['google_id'], 'test123')
        self.assertEqual(user1['name'], 'Test User')
        self.assertEqual(user1['email'], 'test@example.com')
        
        # Récupérer le même utilisateur
        user2 = get_or_create_user(google_id='test123')
        self.assertEqual(user1['id'], user2['id'])
    
    def test_api_auth_user_not_authenticated(self):
        """Test de l'API auth sans authentification"""
        response = self.client.get('/api/auth/user')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertFalse(data['authenticated'])
        self.assertIsNone(data['user'])
    
    def test_contexts_without_auth(self):
        """Test des contextes sans authentification"""
        response = self.client.get('/api/contexts')
        self.assertEqual(response.status_code, 401)
        
        response = self.client.post('/api/contexts', 
                                  json={'name': 'Test', 'data': {}})
        self.assertEqual(response.status_code, 401)
    
    def test_contexts_with_mock_auth(self):
        """Test des contextes avec authentification simulée"""
        with self.client.session_transaction() as sess:
            sess['user_id'] = 1
            sess['google_id'] = 'test123'
        
        # Créer un utilisateur de test
        get_or_create_user('test123', 'Test User', 'test@example.com')
        
        # Test de sauvegarde de contexte
        response = self.client.post('/api/contexts',
                                  json={
                                      'name': 'Test Context',
                                      'data': {
                                          'locations': [],
                                          'regions': []
                                      }
                                  })
        self.assertEqual(response.status_code, 200)
        
        # Test de récupération des contextes
        response = self.client.get('/api/contexts')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
    
    def test_gemini_config(self):
        """Test de la configuration Gemini"""
        response = self.client.get('/api/gemini/config')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('api_key_configured', data)
        self.assertIsInstance(data['api_key_configured'], bool)
    
    def test_static_files_serving(self):
        """Test du service des fichiers statiques"""
        response = self.client.get('/styles.css')
        self.assertEqual(response.status_code, 200)
        
        response = self.client.get('/js/main.js')
        self.assertEqual(response.status_code, 200)

class TestDatabaseManager(unittest.TestCase):
    
    def setUp(self):
        """Configuration avant chaque test"""
        self.test_db = tempfile.mktemp()
        self.db_manager = DatabaseManager()
        self.db_manager.database = self.test_db
        self.db_manager.init_database()
    
    def tearDown(self):
        """Nettoyage après chaque test"""
        if os.path.exists(self.test_db):
            os.unlink(self.test_db)
    
    def test_create_and_get_user(self):
        """Test de création et récupération d'utilisateur"""
        user_id = self.db_manager.create_user(
            'replit_123',
            'Test User',
            'test@example.com'
        )
        
        self.assertIsInstance(user_id, int)
        
        user = self.db_manager.get_user_by_replit_id('replit_123')
        self.assertEqual(user['name'], 'Test User')
        self.assertEqual(user['email'], 'test@example.com')
    
    def test_travel_context_operations(self):
        """Test des opérations sur les contextes de voyage"""
        # Créer un utilisateur de test
        user_id = self.db_manager.create_user('test_user', 'Test', 'test@test.com')
        
        # Sauvegarder un contexte
        context_data = {
            'locations': [{'id': 1, 'name': 'Test Location'}],
            'regions': []
        }
        context_id = self.db_manager.save_travel_context(
            user_id,
            'Test Context',
            context_data
        )
        
        self.assertIsInstance(context_id, int)
        
        # Récupérer les contextes de l'utilisateur
        contexts = self.db_manager.get_user_contexts(user_id)
        self.assertEqual(len(contexts), 1)
        self.assertEqual(contexts[0]['name'], 'Test Context')
        
        # Récupérer le contexte par ID
        context = self.db_manager.get_context_by_id(context_id, user_id)
        self.assertIsNotNone(context)
        self.assertEqual(context['data']['locations'][0]['name'], 'Test Location')
    
    def test_api_usage_logging(self):
        """Test du logging d'usage API"""
        user_id = self.db_manager.create_user('test_user', 'Test', 'test@test.com')
        
        # Logger un usage
        self.db_manager.log_api_usage(
            user_id,
            'gemini_generate',
            1000,
            0.05
        )
        
        # Récupérer l'usage
        usage = self.db_manager.get_user_api_usage(user_id)
        self.assertEqual(len(usage), 1)
        self.assertEqual(usage[0]['endpoint'], 'gemini_generate')
        self.assertEqual(usage[0]['total_tokens'], 1000)

if __name__ == '__main__':
    # Lancer tous les tests
    unittest.main(verbosity=2)
