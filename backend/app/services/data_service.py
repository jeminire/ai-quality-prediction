import json
import pandas as pd
import os
from datetime import datetime
from app.models import db, QualityData, QualityLabel, ProcessData, MaterialBatch, EquipmentStatus, EnvironmentData

class DataService:
    # 10个工艺参数特征名
    PROCESS_FEATURES = [
        'heating_temperature', 
        'forming_pressure', 
        'spindle_speed', 
        'coolant_flow', 
        'vibration_amplitude', 
        'current_intensity',
        'mold_temperature', 
        'feed_rate', 
        'lubricant_flow', 
        'clamp_force'
    ]
    
    @staticmethod
    def get_project_root():
        """获取项目根目录"""
        return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    @staticmethod
    def get_all_data(page=1, per_page=10):
        paginated = QualityLabel.query.order_by(QualityLabel.id.desc()).paginate(page=page, per_page=per_page)
        return {
            'data': [d.to_dict() for d in paginated.items],
            'total': paginated.total,
            'page': page,
            'per_page': per_page
        }
    
    @staticmethod
    def get_data_by_id(data_id):
        data = QualityLabel.query.get(data_id)
        return data.to_dict() if data else None
    
    @staticmethod
    def add_data(features, label=None, batch_id=None):
        # 为了保持兼容性，这里创建一个 QualityLabel 记录
        new_data = QualityLabel(
            batch_id=batch_id or '',
            material_batch_id='',
            quality_status=int(label) if label else 0,
            defect_type='',
            root_cause='',
            thickness=0.0,
            parallelism=0.0,
            hardness=0.0,
            surface_roughness=0.0,
            inspection_time=datetime.now(),
            inspector='API'
        )
        db.session.add(new_data)
        db.session.commit()
        return new_data.to_dict()
    
    @staticmethod
    def add_batch_data(data_list):
        records = []
        for item in data_list:
            batch_id = item.get('batch_id', '')
            label = item.get('label', 0)
            records.append(QualityLabel(
                batch_id=batch_id,
                material_batch_id='',
                quality_status=int(label),
                defect_type='',
                root_cause='',
                thickness=0.0,
                parallelism=0.0,
                hardness=0.0,
                surface_roughness=0.0,
                inspection_time=datetime.now(),
                inspector='API'
            ))
        db.session.add_all(records)
        db.session.commit()
        return {'count': len(records)}
    
    @staticmethod
    def update_data(data_id, features=None, label=None):
        data = QualityLabel.query.get(data_id)
        if not data:
            return None
        
        if label is not None:
            data.quality_status = int(label)
        
        db.session.commit()
        return data.to_dict()
    
    @staticmethod
    def delete_data(data_id):
        data = QualityLabel.query.get(data_id)
        if not data:
            return False
        
        db.session.delete(data)
        db.session.commit()
        return True
    
    @staticmethod
    def get_statistics():
        total = QualityLabel.query.count()
        pass_count = QualityLabel.query.filter(QualityLabel.quality_status == 0).count()
        fail_count = QualityLabel.query.filter(QualityLabel.quality_status == 1).count()
        
        return {
            'total_records': total,
            'pass_count': pass_count,
            'fail_count': fail_count,
            'pass_rate': round(pass_count / total * 100, 2) if total > 0 else 0
        }
    
    @staticmethod
    def get_training_data():
        """获取已标注的数据用于训练"""
        all_data = QualityData.query.filter(QualityData.label.isnot(None)).all()
        
        if not all_data:
            return [], [], DataService.PROCESS_FEATURES
        
        # 使用固定的特征顺序
        feature_names = DataService.PROCESS_FEATURES
        
        X = []
        y = []
        
        for data in all_data:
            try:
                features = data.features
                if isinstance(features, str):
                    features = json.loads(features)
                
                # 按固定顺序提取特征值
                feature_values = []
                for feature_name in feature_names:
                    feature_values.append(features.get(feature_name, 0.0))
                
                X.append(feature_values)
                y.append(data.label)
            except Exception as e:
                continue
        
        return X, y, feature_names
    
    @staticmethod
    def import_process_data():
        """导入工艺参数数据（5000条，无标签）"""
        project_root = DataService.get_project_root()
        process_file = os.path.join(project_root, 'data', 'process_data.csv')
        
        if not os.path.exists(process_file):
            raise ValueError(f"工艺参数文件不存在: {process_file}")
        
        df = pd.read_csv(process_file, encoding='utf-8-sig')
        
        batch_records = {}
        
        for _, row in df.iterrows():
            batch_id = row.get('batch_id', '')
            features = {}
            
            # 提取10个工艺参数
            for feature_name in DataService.PROCESS_FEATURES:
                if feature_name in df.columns:
                    try:
                        value = row[feature_name]
                        if pd.notna(value):
                            features[feature_name] = float(value)
                        else:
                            features[feature_name] = 0.0
                    except (ValueError, TypeError):
                        features[feature_name] = 0.0
            
            if not features:
                continue
            
            # 按batch_id分组，同一batch的数据合并为一条记录（取平均值）
            if batch_id not in batch_records:
                batch_records[batch_id] = {'features': features, 'count': 1}
            else:
                # 累加特征值用于计算平均值
                for key in features:
                    batch_records[batch_id]['features'][key] += features[key]
                batch_records[batch_id]['count'] += 1
        
        # 计算平均值并批量插入
        records_to_insert = []
        for batch_id, data in batch_records.items():
            avg_features = {k: v / data['count'] for k, v in data['features'].items()}
            records_to_insert.append(QualityData(
                features=avg_features,
                label=None,
                batch_id=batch_id
            ))
        
        db.session.add_all(records_to_insert)
        db.session.commit()
        
        return {'imported_count': len(records_to_insert)}
    
    @staticmethod
    def import_quality_data():
        """导入质量标签数据（100条），按batch_id匹配更新"""
        project_root = DataService.get_project_root()
        quality_file = os.path.join(project_root, 'data', 'quality_label.csv')
        
        if not os.path.exists(quality_file):
            raise ValueError(f"质量标签文件不存在: {quality_file}")
        
        df = pd.read_csv(quality_file, encoding='utf-8-sig')
        
        updated_count = 0
        
        for _, row in df.iterrows():
            batch_id = row.get('batch_id', '')
            quality_status = row.get('quality_status')
            
            if not batch_id or pd.isna(quality_status):
                continue
            
            # 查找匹配的工艺参数记录
            data_record = QualityData.query.filter_by(batch_id=batch_id).first()
            
            if data_record:
                data_record.label = float(quality_status)
                updated_count += 1
        
        db.session.commit()
        
        return {'updated_count': updated_count}
    
    @staticmethod
    def import_material_data():
        """导入物料批次数据"""
        project_root = DataService.get_project_root()
        material_file = os.path.join(project_root, 'data', 'material_data.csv')
        
        if not os.path.exists(material_file):
            raise ValueError(f"物料批次文件不存在: {material_file}")
        
        df = pd.read_csv(material_file, encoding='utf-8-sig')
        
        count = 0
        for _, row in df.iterrows():
            record = MaterialBatch(
                material_batch_id=row['material_batch_id'],
                supplier=row['supplier'],
                material_type=row['material_type'],
                carbon_content=row['carbon_content'] if pd.notna(row['carbon_content']) else None,
                silicon_content=row['silicon_content'] if pd.notna(row['silicon_content']) else None,
                manganese_content=row['manganese_content'] if pd.notna(row['manganese_content']) else None,
                phosphorus_content=row['phosphorus_content'] if pd.notna(row['phosphorus_content']) else None,
                sulfur_content=row['sulfur_content'] if pd.notna(row['sulfur_content']) else None,
                raw_hardness=row['raw_hardness'] if pd.notna(row['raw_hardness']) else None,
                tensile_strength=row['tensile_strength'] if pd.notna(row['tensile_strength']) else None,
                inspection_date=pd.to_datetime(row['inspection_date']) if pd.notna(row['inspection_date']) else None,
                material_status=row['material_status'],
                risk_reason=row.get('risk_reason', ''),
                storage_temperature=row['storage_temperature'] if pd.notna(row['storage_temperature']) else None,
                storage_humidity=row['storage_humidity'] if pd.notna(row['storage_humidity']) else None
            )
            db.session.add(record)
            count += 1
            
            if count % 50 == 0:
                db.session.commit()
        
        db.session.commit()
        
        return {'imported_count': count}
    
    @staticmethod
    def import_equipment_data():
        """导入设备状态数据"""
        project_root = DataService.get_project_root()
        equipment_file = os.path.join(project_root, 'data', 'equipment_data.csv')
        
        if not os.path.exists(equipment_file):
            raise ValueError(f"设备状态文件不存在: {equipment_file}")
        
        df = pd.read_csv(equipment_file, encoding='utf-8-sig')
        
        count = 0
        for _, row in df.iterrows():
            record = EquipmentStatus(
                equipment_id=row['equipment_id'],
                timestamp=pd.to_datetime(row['timestamp']) if pd.notna(row['timestamp']) else None,
                status=row['status'],
                temperature=row['temperature'] if pd.notna(row['temperature']) else None,
                vibration=row['vibration'] if pd.notna(row['vibration']) else None,
                power_consumption=row['power_consumption'] if pd.notna(row['power_consumption']) else None,
                oil_pressure=row['oil_pressure'] if pd.notna(row['oil_pressure']) else None,
                hydraulic_pressure=row['hydraulic_pressure'] if pd.notna(row['hydraulic_pressure']) else None,
                spindle_load=row['spindle_load'] if pd.notna(row['spindle_load']) else None,
                operating_hours=row['operating_hours'] if pd.notna(row['operating_hours']) else None
            )
            db.session.add(record)
            count += 1
            
            if count % 200 == 0:
                db.session.commit()
        
        db.session.commit()
        
        return {'imported_count': count}
    
    @staticmethod
    def import_environment_data():
        """导入环境参数数据"""
        project_root = DataService.get_project_root()
        environment_file = os.path.join(project_root, 'data', 'environment_data.csv')
        
        if not os.path.exists(environment_file):
            raise ValueError(f"环境参数文件不存在: {environment_file}")
        
        df = pd.read_csv(environment_file, encoding='utf-8-sig')
        
        count = 0
        for _, row in df.iterrows():
            record = EnvironmentData(
                zone_id=row['zone_id'],
                timestamp=pd.to_datetime(row['timestamp']) if pd.notna(row['timestamp']) else None,
                temperature=row['temperature'] if pd.notna(row['temperature']) else None,
                humidity=row['humidity'] if pd.notna(row['humidity']) else None,
                air_pressure=row['air_pressure'] if pd.notna(row['air_pressure']) else None,
                dust_concentration=row['dust_concentration'] if pd.notna(row['dust_concentration']) else None,
                noise_level=row['noise_level'] if pd.notna(row['noise_level']) else None,
                light_intensity=row['light_intensity'] if pd.notna(row['light_intensity']) else None
            )
            db.session.add(record)
            count += 1
            
            if count % 500 == 0:
                db.session.commit()
        
        db.session.commit()
        
        return {'imported_count': count}
    
    @staticmethod
    def import_all_data():
        """一键导入所有数据"""
        results = {
            'process': DataService.import_process_data(),
            'quality': DataService.import_quality_data(),
            'material': DataService.import_material_data(),
            'equipment': DataService.import_equipment_data(),
            'environment': DataService.import_environment_data()
        }
        return results
    
    @staticmethod
    def get_process_data(page=1, per_page=20):
        """获取工艺参数数据"""
        paginated = ProcessData.query.order_by(ProcessData.id.desc()).paginate(page=page, per_page=per_page)
        return {
            'data': [d.to_dict() for d in paginated.items],
            'total': paginated.total,
            'page': page,
            'per_page': per_page
        }
    
    @staticmethod
    def get_material_batch(page=1, per_page=20):
        """获取物料批次数据"""
        paginated = MaterialBatch.query.order_by(MaterialBatch.id.desc()).paginate(page=page, per_page=per_page)
        return {
            'data': [d.to_dict() for d in paginated.items],
            'total': paginated.total,
            'page': page,
            'per_page': per_page
        }
    
    @staticmethod
    def get_quality_label(page=1, per_page=20):
        """获取质量标签数据"""
        paginated = QualityLabel.query.order_by(QualityLabel.id.desc()).paginate(page=page, per_page=per_page)
        return {
            'data': [d.to_dict() for d in paginated.items],
            'total': paginated.total,
            'page': page,
            'per_page': per_page
        }
    
    @staticmethod
    def get_equipment_status(page=1, per_page=20):
        """获取设备状态数据"""
        paginated = EquipmentStatus.query.order_by(EquipmentStatus.id.desc()).paginate(page=page, per_page=per_page)
        return {
            'data': [d.to_dict() for d in paginated.items],
            'total': paginated.total,
            'page': page,
            'per_page': per_page
        }
    
    @staticmethod
    def get_environment_data(page=1, per_page=20):
        """获取环境参数数据"""
        paginated = EnvironmentData.query.order_by(EnvironmentData.id.desc()).paginate(page=page, per_page=per_page)
        return {
            'data': [d.to_dict() for d in paginated.items],
            'total': paginated.total,
            'page': page,
            'per_page': per_page
        }
    
    @staticmethod
    def upload_process_data(file_stream):
        """从上传的文件流导入工艺参数数据"""
        df = pd.read_csv(file_stream)
        
        count = 0
        for _, row in df.iterrows():
            record = ProcessData(
                record_id=row.get('record_id', ''),
                batch_id=row.get('batch_id', ''),
                timestamp=pd.to_datetime(row['timestamp']) if pd.notna(row['timestamp']) else None,
                heating_temperature=row['heating_temperature'] if pd.notna(row['heating_temperature']) else None,
                forming_pressure=row['forming_pressure'] if pd.notna(row['forming_pressure']) else None,
                spindle_speed=row['spindle_speed'] if pd.notna(row['spindle_speed']) else None,
                coolant_flow=row['coolant_flow'] if pd.notna(row['coolant_flow']) else None,
                vibration_amplitude=row['vibration_amplitude'] if pd.notna(row['vibration_amplitude']) else None,
                current_intensity=row['current_intensity'] if pd.notna(row['current_intensity']) else None,
                mold_temperature=row['mold_temperature'] if pd.notna(row['mold_temperature']) else None,
                feed_rate=row['feed_rate'] if pd.notna(row['feed_rate']) else None,
                lubricant_flow=row['lubricant_flow'] if pd.notna(row['lubricant_flow']) else None,
                clamp_force=row['clamp_force'] if pd.notna(row['clamp_force']) else None,
                equipment_id=row.get('equipment_id', ''),
                operator_id=row.get('operator_id', '')
            )
            db.session.add(record)
            count += 1
            
            if count % 200 == 0:
                db.session.commit()
        
        db.session.commit()
        return {'imported_count': count}
    
    @staticmethod
    def upload_material_data(file_stream):
        """从上传的文件流导入物料批次数据"""
        df = pd.read_csv(file_stream)
        
        count = 0
        for _, row in df.iterrows():
            record = MaterialBatch(
                material_batch_id=row['material_batch_id'],
                supplier=row['supplier'],
                material_type=row['material_type'],
                carbon_content=row['carbon_content'] if pd.notna(row['carbon_content']) else None,
                silicon_content=row['silicon_content'] if pd.notna(row['silicon_content']) else None,
                manganese_content=row['manganese_content'] if pd.notna(row['manganese_content']) else None,
                phosphorus_content=row['phosphorus_content'] if pd.notna(row['phosphorus_content']) else None,
                sulfur_content=row['sulfur_content'] if pd.notna(row['sulfur_content']) else None,
                raw_hardness=row['raw_hardness'] if pd.notna(row['raw_hardness']) else None,
                tensile_strength=row['tensile_strength'] if pd.notna(row['tensile_strength']) else None,
                inspection_date=pd.to_datetime(row['inspection_date']) if pd.notna(row['inspection_date']) else None,
                material_status=row['material_status'],
                risk_reason=row.get('risk_reason', ''),
                storage_temperature=row['storage_temperature'] if pd.notna(row['storage_temperature']) else None,
                storage_humidity=row['storage_humidity'] if pd.notna(row['storage_humidity']) else None
            )
            db.session.add(record)
            count += 1
            
            if count % 50 == 0:
                db.session.commit()
        
        db.session.commit()
        return {'imported_count': count}
    
    @staticmethod
    def upload_quality_data(file_stream):
        """从上传的文件流导入质量标签数据"""
        df = pd.read_csv(file_stream)
        
        count = 0
        for _, row in df.iterrows():
            record = QualityLabel(
                batch_id=row['batch_id'],
                material_batch_id=row['material_batch_id'],
                quality_status=int(row['quality_status']) if pd.notna(row['quality_status']) else 0,
                defect_type=row.get('defect_type', ''),
                root_cause=row.get('root_cause', ''),
                thickness=row['thickness'] if pd.notna(row['thickness']) else None,
                parallelism=row['parallelism'] if pd.notna(row['parallelism']) else None,
                hardness=row['hardness'] if pd.notna(row['hardness']) else None,
                surface_roughness=row['surface_roughness'] if pd.notna(row['surface_roughness']) else None,
                inspection_time=pd.to_datetime(row['inspection_time']) if pd.notna(row['inspection_time']) else None,
                inspector=row.get('inspector', '')
            )
            db.session.add(record)
            count += 1
            
            if count % 50 == 0:
                db.session.commit()
        
        db.session.commit()
        return {'imported_count': count}
    
    @staticmethod
    def upload_equipment_data(file_stream):
        """从上传的文件流导入设备状态数据"""
        df = pd.read_csv(file_stream)
        
        count = 0
        for _, row in df.iterrows():
            record = EquipmentStatus(
                equipment_id=row['equipment_id'],
                timestamp=pd.to_datetime(row['timestamp']) if pd.notna(row['timestamp']) else None,
                status=row['status'],
                temperature=row['temperature'] if pd.notna(row['temperature']) else None,
                vibration=row['vibration'] if pd.notna(row['vibration']) else None,
                power_consumption=row['power_consumption'] if pd.notna(row['power_consumption']) else None,
                oil_pressure=row['oil_pressure'] if pd.notna(row['oil_pressure']) else None,
                hydraulic_pressure=row['hydraulic_pressure'] if pd.notna(row['hydraulic_pressure']) else None,
                spindle_load=row['spindle_load'] if pd.notna(row['spindle_load']) else None,
                operating_hours=row['operating_hours'] if pd.notna(row['operating_hours']) else None
            )
            db.session.add(record)
            count += 1
            
            if count % 200 == 0:
                db.session.commit()
        
        db.session.commit()
        return {'imported_count': count}
    
    @staticmethod
    def upload_environment_data(file_stream):
        """从上传的文件流导入环境参数数据"""
        df = pd.read_csv(file_stream)
        
        count = 0
        for _, row in df.iterrows():
            record = EnvironmentData(
                zone_id=row['zone_id'],
                timestamp=pd.to_datetime(row['timestamp']) if pd.notna(row['timestamp']) else None,
                temperature=row['temperature'] if pd.notna(row['temperature']) else None,
                humidity=row['humidity'] if pd.notna(row['humidity']) else None,
                air_pressure=row['air_pressure'] if pd.notna(row['air_pressure']) else None,
                dust_concentration=row['dust_concentration'] if pd.notna(row['dust_concentration']) else None,
                noise_level=row['noise_level'] if pd.notna(row['noise_level']) else None,
                light_intensity=row['light_intensity'] if pd.notna(row['light_intensity']) else None
            )
            db.session.add(record)
            count += 1
            
            if count % 500 == 0:
                db.session.commit()
        
        db.session.commit()
        return {'imported_count': count}

    @staticmethod
    def delete_process_data(id):
        """删除工艺参数数据"""
        record = ProcessData.query.get(id)
        if not record:
            return False
        db.session.delete(record)
        db.session.commit()
        return True

    @staticmethod
    def delete_material_batch(id):
        """删除物料批次数据"""
        record = MaterialBatch.query.get(id)
        if not record:
            return False
        db.session.delete(record)
        db.session.commit()
        return True

    @staticmethod
    def delete_quality_label(id):
        """删除质量标签数据"""
        record = QualityLabel.query.get(id)
        if not record:
            return False
        db.session.delete(record)
        db.session.commit()
        return True

    @staticmethod
    def delete_equipment_status(id):
        """删除设备状态数据"""
        record = EquipmentStatus.query.get(id)
        if not record:
            return False
        db.session.delete(record)
        db.session.commit()
        return True

    @staticmethod
    def delete_environment_data(id):
        """删除环境参数数据"""
        record = EnvironmentData.query.get(id)
        if not record:
            return False
        db.session.delete(record)
        db.session.commit()
        return True
    
    @staticmethod
    def get_batch_with_relations(batch_id):
        """获取批次的完整关联数据（包含物料批次、工艺参数、设备状态、环境数据）"""
        quality_label = QualityLabel.query.filter_by(batch_id=batch_id).first()
        if not quality_label:
            return None
        
        result = quality_label.to_dict()
        
        if quality_label.material_batch:
            result['material_batch'] = quality_label.material_batch.to_dict()
        else:
            result['material_batch'] = None
        
        process_records = ProcessData.query.filter_by(batch_id=batch_id).all()
        result['process_data'] = [p.to_dict() for p in process_records]
        
        equipment_ids = set(p.equipment_id for p in process_records if p.equipment_id)
        equipment_status_list = []
        for eq_id in equipment_ids:
            latest_status = EquipmentStatus.query.filter_by(equipment_id=eq_id).order_by(EquipmentStatus.timestamp.desc()).first()
            if latest_status:
                equipment_status_list.append(latest_status.to_dict())
        result['equipment_status'] = equipment_status_list
        
        if process_records:
            first_process = process_records[0]
            if first_process.timestamp:
                env_data = EnvironmentData.query.filter(
                    EnvironmentData.timestamp <= first_process.timestamp
                ).order_by(EnvironmentData.timestamp.desc()).first()
                if env_data:
                    result['environment_data'] = env_data.to_dict()
                else:
                    result['environment_data'] = None
            else:
                result['environment_data'] = None
        else:
            result['environment_data'] = None
        
        return result
    
    @staticmethod
    def get_all_batches_with_relations(page=1, per_page=10):
        """获取所有批次的关联数据列表"""
        paginated = QualityLabel.query.order_by(QualityLabel.id.desc()).paginate(page=page, per_page=per_page)
        
        results = []
        for quality_label in paginated.items:
            batch_data = quality_label.to_dict()
            
            if quality_label.material_batch:
                batch_data['material_batch'] = quality_label.material_batch.to_dict()
            else:
                batch_data['material_batch'] = None
            
            process_records = ProcessData.query.filter_by(batch_id=quality_label.batch_id).all()
            batch_data['process_data'] = [p.to_dict() for p in process_records]
            
            equipment_ids = set(p.equipment_id for p in process_records if p.equipment_id)
            equipment_status_list = []
            for eq_id in equipment_ids:
                latest_status = EquipmentStatus.query.filter_by(equipment_id=eq_id).order_by(EquipmentStatus.timestamp.desc()).first()
                if latest_status:
                    equipment_status_list.append(latest_status.to_dict())
            batch_data['equipment_status'] = equipment_status_list
            
            if process_records and process_records[0].timestamp:
                env_data = EnvironmentData.query.filter(
                    EnvironmentData.timestamp <= process_records[0].timestamp
                ).order_by(EnvironmentData.timestamp.desc()).first()
                if env_data:
                    batch_data['environment_data'] = env_data.to_dict()
                else:
                    batch_data['environment_data'] = None
            else:
                batch_data['environment_data'] = None
            
            results.append(batch_data)
        
        return {
            'data': results,
            'total': paginated.total,
            'page': page,
            'per_page': per_page
        }