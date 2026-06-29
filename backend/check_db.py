# -*- coding: utf-8 -*-
"""
测试删除操作是否在数据库中生效
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import create_app
from app.models import db, ProcessData, MaterialBatch, QualityLabel, EquipmentStatus, EnvironmentData

def check_table_counts():
    """检查各表的数据数量"""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("数据库表数据统计")
        print("=" * 60)
        print(f"ProcessData (工艺参数): {ProcessData.query.count()} 条")
        print(f"MaterialBatch (物料批次): {MaterialBatch.query.count()} 条")
        print(f"QualityLabel (质量标签): {QualityLabel.query.count()} 条")
        print(f"EquipmentStatus (设备状态): {EquipmentStatus.query.count()} 条")
        print(f"EnvironmentData (环境参数): {EnvironmentData.query.count()} 条")
        print("=" * 60)
        
        # 显示前几条数据
        print("\nProcessData 前3条数据:")
        for record in ProcessData.query.limit(3).all():
            print(f"  ID: {record.id}, record_id: {record.record_id}, batch_id: {record.batch_id}")
        
        print("\nMaterialBatch 前3条数据:")
        for record in MaterialBatch.query.limit(3).all():
            print(f"  ID: {record.id}, material_batch_id: {record.material_batch_id}")

if __name__ == '__main__':
    check_table_counts()