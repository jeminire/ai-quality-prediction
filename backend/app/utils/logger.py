import os
import logging
from logging.handlers import RotatingFileHandler
from app.config import Config

def setup_logger(app):
    log_level = getattr(logging, Config.LOG_LEVEL.upper(), logging.INFO)
    
    # 确保日志目录存在
    log_dir = os.path.dirname(Config.LOG_FILE)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # 创建日志处理器
    file_handler = RotatingFileHandler(
        Config.LOG_FILE,
        maxBytes=1024 * 1024 * 50,
        backupCount=5,
        encoding='utf-8'
    )
    
    console_handler = logging.StreamHandler()
    
    # 日志格式
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # 添加处理器到应用日志
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(log_level)
    
    return app.logger