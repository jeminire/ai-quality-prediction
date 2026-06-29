# -*- coding: utf-8 -*-
"""
完整的数据导入脚本 - 导入所有CSV数据到数据库
"""
import sys
import os
import pandas as pd
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def parse_datetime(value):
    """安全解析日期时间"""
    if pd.isna(value) or value is None:
        return None
    try:
        return pd.to_datetime(value)
    except:
        return None

def import_process_data(db, ProcessData):
    """导入工艺参数数据"""
    print("开始导入工艺参数数据...")
    
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'process_data.csv')
    if not os.path.exists(data_path):
        print(f"警告: 工艺参数文件不存在: {data_path}")
        return 0
    
    df = pd.read_csv(data_path, encoding='utf-8-sig')
    
    ProcessData.query.delete()
    db.session.commit()
    
    count = 0
    for _, row in df.iterrows():
        record = ProcessData(
            record_id=row['record_id'],
            batch_id=row['batch_id'],
            timestamp=parse_datetime(row['timestamp']),
            heating_temperature=row['heating_temperature'] if pd.notna(row['heating_temperature']) else None,
            forming_pressure=row['forming_pressure'] if pd.notna(row['forming_pressure']) else None,
            spindle_speed=row['spindle_speed'] if pd.notna(row['spindle_speed']) else None,
            coolant_flow=row['coolant_flow'] if pd.notna(row['coolant_flow']) else None,
            vibration_amplitude=row.get('vibration_amplitude'),
            current_intensity=row['current_intensity'] if pd.notna(row['current_intensity']) else None,
            mold_temperature=row['mold_temperature'] if pd.notna(row['mold_temperature']) else None,
            feed_rate=row['feed_rate'] if pd.notna(row['feed_rate']) else None,
            lubricant_flow=row['lubricant_flow'] if pd.notna(row['lubricant_flow']) else None,
            clamp_force=row['clamp_force'] if pd.notna(row['clamp_force']) else None,
            equipment_id=row['equipment_id'],
            operator_id=row['operator_id']
        )
        db.session.add(record)
        count += 1
        
        if count % 500 == 0:
            db.session.commit()
            print(f"已导入 {count} 条工艺参数数据...")
    
    db.session.commit()
    print(f"工艺参数数据导入完成！共 {count} 条记录")
    return count

def import_quality_data(db, QualityLabel):
    """导入质量标签数据"""
    print("\n开始导入质量标签数据...")
    
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'quality_label.csv')
    if not os.path.exists(data_path):
        print(f"警告: 质量标签文件不存在: {data_path}")
        return 0
    
    df = pd.read_csv(data_path, encoding='utf-8-sig')
    
    QualityLabel.query.delete()
    db.session.commit()
    
    count = 0
    for _, row in df.iterrows():
        record = QualityLabel(
            batch_id=row['batch_id'],
            material_batch_id=row['material_batch_id'],
            quality_status=int(row['quality_status']),
            defect_type=row['defect_type'],
            root_cause=row['root_cause'],
            thickness=row['thickness'] if pd.notna(row['thickness']) else None,
            parallelism=row['parallelism'] if pd.notna(row['parallelism']) else None,
            hardness=row['hardness'] if pd.notna(row['hardness']) else None,
            surface_roughness=row['surface_roughness'] if pd.notna(row['surface_roughness']) else None,
            inspection_time=parse_datetime(row['inspection_time']),
            inspector=row['inspector']
        )
        db.session.add(record)
        count += 1
        
        if count % 100 == 0:
            db.session.commit()
            print(f"已导入 {count} 条质量标签数据...")
    
    db.session.commit()
    print(f"质量标签数据导入完成！共 {count} 条记录")
    return count

def import_material_data(db, MaterialBatch):
    """导入物料批次数据"""
    print("\n开始导入物料批次数据...")
    
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'material_data.csv')
    if not os.path.exists(data_path):
        print(f"警告: 物料批次文件不存在: {data_path}")
        return 0
    
    df = pd.read_csv(data_path, encoding='utf-8-sig')
    
    MaterialBatch.query.delete()
    db.session.commit()
    
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
            inspection_date=parse_datetime(row['inspection_date']),
            material_status=row['material_status'],
            risk_reason=row.get('risk_reason'),
            storage_temperature=row['storage_temperature'] if pd.notna(row['storage_temperature']) else None,
            storage_humidity=row['storage_humidity'] if pd.notna(row['storage_humidity']) else None
        )
        db.session.add(record)
        count += 1
        
        if count % 50 == 0:
            db.session.commit()
            print(f"已导入 {count} 条物料批次数据...")
    
    db.session.commit()
    print(f"物料批次数据导入完成！共 {count} 条记录")
    return count

def import_equipment_data(db, EquipmentStatus):
    """导入设备状态数据"""
    print("\n开始导入设备状态数据...")
    
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'equipment_data.csv')
    if not os.path.exists(data_path):
        print(f"警告: 设备状态文件不存在: {data_path}")
        return 0
    
    df = pd.read_csv(data_path, encoding='utf-8-sig')
    
    EquipmentStatus.query.delete()
    db.session.commit()
    
    count = 0
    for _, row in df.iterrows():
        record = EquipmentStatus(
            equipment_id=row['equipment_id'],
            timestamp=parse_datetime(row['timestamp']),
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
            print(f"已导入 {count} 条设备状态数据...")
    
    db.session.commit()
    print(f"设备状态数据导入完成！共 {count} 条记录")
    return count

def import_environment_data(db, EnvironmentData):
    """导入环境参数数据"""
    print("\n开始导入环境参数数据...")
    
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'environment_data.csv')
    if not os.path.exists(data_path):
        print(f"警告: 环境参数文件不存在: {data_path}")
        return 0
    
    df = pd.read_csv(data_path, encoding='utf-8-sig')
    
    EnvironmentData.query.delete()
    db.session.commit()
    
    count = 0
    for _, row in df.iterrows():
        record = EnvironmentData(
            zone_id=row['zone_id'],
            timestamp=parse_datetime(row['timestamp']),
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
            print(f"已导入 {count} 条环境参数数据...")
    
    db.session.commit()
    print(f"环境参数数据导入完成！共 {count} 条记录")
    return count

def main():
    """主函数"""
    print("=" * 60)
    print("开始完整数据导入流程")
    print("=" * 60)
    
    from app.main import create_app
    
    app = create_app()
    
    with app.app_context():
        from app.models import db, ProcessData, QualityLabel, MaterialBatch, EquipmentStatus, EnvironmentData
        
        db.create_all()
        
        process_count = import_process_data(db, ProcessData)
        quality_count = import_quality_data(db, QualityLabel)
        material_count = import_material_data(db, MaterialBatch)
        equipment_count = import_equipment_data(db, EquipmentStatus)
        environment_count = import_environment_data(db, EnvironmentData)
        
        print("\n" + "=" * 60)
        print("数据导入完成！统计信息：")
        print("=" * 60)
        print(f"工艺参数数据：{process_count} 条")
        print(f"质量标签数据：{quality_count} 条")
        print(f"物料批次数据：{material_count} 条")
        print(f"设备状态数据：{equipment_count} 条")
        print(f"环境参数数据：{environment_count} 条")
        print("=" * 60)

if __name__ == '__main__':
    main()
