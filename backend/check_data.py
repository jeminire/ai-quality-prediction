from app.main import create_app
app = create_app()
with app.app_context():
    from app.models import db, QualityLabel, ProcessData, MaterialBatch, EquipmentStatus, EnvironmentData, QualityData
    print('QualityLabel:', QualityLabel.query.count())
    print('ProcessData:', ProcessData.query.count())
    print('MaterialBatch:', MaterialBatch.query.count())
    print('EquipmentStatus:', EquipmentStatus.query.count())
    print('EnvironmentData:', EnvironmentData.query.count())
    print('QualityData:', QualityData.query.count())
    first_quality = QualityData.query.first()
    if first_quality:
        print('QualityData first:', first_quality.to_dict())
    first_label = QualityLabel.query.first()
    if first_label:
        print('QualityLabel first:', first_label.to_dict())
