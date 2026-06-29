# -*- coding: utf-8 -*-
"""
手动删除一条数据并验证
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import create_app
from app.models import db, ProcessData

def delete_and_check():
    """删除一条数据并验证"""
    app = create_app()
    
    with app.app_context():
        # 获取第一条数据
        first_record = ProcessData.query.first()
        if not first_record:
            print("数据库中没有数据")
            return
        
        record_id = first_record.id
        print(f"准备删除 ID: {record_id}, record_id: {first_record.record_id}")
        
        # 删除前统计
        count_before = ProcessData.query.count()
        print(f"删除前总数据量: {count_before}")
        
        # 删除数据
        db.session.delete(first_record)
        db.session.commit()
        print(f"已删除 ID: {record_id}")
        
        # 删除后统计
        count_after = ProcessData.query.count()
        print(f"删除后总数据量: {count_after}")
        
        # 验证删除
        deleted_record = ProcessData.query.get(record_id)
        if deleted_record:
            print(f"错误: ID {record_id} 仍然存在于数据库中！")
        else:
            print(f"成功: ID {record_id} 已从数据库中删除")
        
        # 检查是否真的减少了
        if count_after == count_before - 1:
            print("验证通过: 数据量正确减少了1条")
        else:
            print(f"验证失败: 数据量应该减少1条，实际减少了 {count_before - count_after} 条")

if __name__ == '__main__':
    delete_and_check()