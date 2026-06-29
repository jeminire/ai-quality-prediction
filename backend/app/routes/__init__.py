def register_routes(app):
    from .data import data_bp
    from .model import model_bp
    from .predict import predict_bp
    from .shap import shap_bp
    
    app.register_blueprint(data_bp, url_prefix='/api/v1/data')
    app.register_blueprint(model_bp, url_prefix='/api/v1/models')
    app.register_blueprint(predict_bp, url_prefix='/api/v1/predict')
    app.register_blueprint(shap_bp, url_prefix='/api/v1/shap')