__version__ = '1.0.0'

from flask import Flask
from flask_cors import CORS


def create_app(environment='development'):
    """创建并配置Flask应用实例"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'dev-secret-key'
    app.config['JSON_AS_ASCII'] = False
    
    # 启用CORS
    CORS(app)
    
    # 注册蓝图
    from .routes import register_routes
    register_routes(app)
    
    return app