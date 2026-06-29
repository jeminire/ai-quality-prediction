import sys
import os

# 添加deps目录到Python路径
deps_path = os.path.join(os.path.dirname(__file__), '..', 'deps')
if os.path.exists(deps_path):
    sys.path.insert(0, os.path.abspath(deps_path))

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import config
from app.models import db
from app.utils.logger import setup_logger
from app.routes import register_routes

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # 初始化数据库
    db.init_app(app)
    
    # 初始化JWT
    JWTManager(app)
    
    # 配置CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # 禁用缓存，确保数据实时同步
    @app.after_request
    def add_no_cache_headers(response):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    
    # 设置日志
    setup_logger(app)
    
    # 注册路由
    register_routes(app)
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host=app.config['SERVER_HOST'],
        port=app.config['SERVER_PORT'],
        debug=app.config['DEBUG']
    )