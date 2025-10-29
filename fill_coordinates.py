#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV地址转坐标填充工具
用于将CSV文件中缺失的经纬度坐标通过地址自动填充
"""

import csv
import json
import time
import requests
import urllib.parse
import os
from typing import Dict, List, Optional, Union

# 地理编码缓存，避免重复调用API
geocode_cache = {}

# API请求间隔（毫秒），Nominatim限制较严格，建议使用1000ms
API_DELAY_MS = 1000

def address_to_coordinates(address: str) -> Optional[Dict[str, float]]:
    """
    使用OpenStreetMap的Nominatim服务将地址转换为经纬度坐标
    
    Args:
        address (str): 要转换的地址
    
    Returns:
        Dict or None: 成功时返回包含lat和lng的字典，失败时返回None
    """
    # 检查缓存
    if address in geocode_cache:
        print(f"[缓存命中] {address}")
        return geocode_cache[address]
    
    # 处理空地址
    if not address or address.strip() == '':
        print(f"[跳过] 地址为空")
        return None
    
    try:
        # 编码地址
        encoded_address = urllib.parse.quote(address)
        
        # Nominatim API请求URL
        url = f"https://nominatim.openstreetmap.org/search?q={encoded_address}&format=json&limit=1&accept-language=zh-CN"
        
        print(f"[请求] {address}")
        
        # 设置User-Agent以符合Nominatim使用政策
        headers = {
            'User-Agent': 'wm_map_app/1.0 (employee map application)',
            'Accept': 'application/json'
        }
        
        # 发送请求
        response = requests.get(url, headers=headers, timeout=10)
        
        if not response.ok:
            print(f"[失败] HTTP错误: {response.status_code} - {response.text}")
            return None
        
        # 解析JSON响应
        data = response.json()
        
        if data and len(data) > 0:
            location = {
                'lat': float(data[0]['lat']),
                'lng': float(data[0]['lon'])
            }
            
            # 存入缓存
            geocode_cache[address] = location
            
            print(f"[成功] {address} -> ({location['lat']}, {location['lng']})")
            return location
        else:
            print(f"[失败] 未找到地址: {address}")
            return None
    
    except Exception as e:
        print(f"[错误] {address} - {str(e)}")
        return None

def is_empty_field(field: str) -> bool:
    """
    检查字段是否为空
    
    Args:
        field: 要检查的字段
    
    Returns:
        bool: 字段为空返回True，否则返回False
    """
    return field is None or field.strip() == ''

def process_csv(input_file: str, output_file: str) -> Dict:
    """
    处理CSV文件，填充缺失的经纬度坐标
    
    Args:
        input_file: 输入CSV文件路径
        output_file: 输出CSV文件路径
    
    Returns:
        Dict: 处理统计信息
    """
    stats = {
        'total_rows': 0,
        'processed_rows': 0,
        'home_address_filled': 0,
        'work_address_filled': 0,
        'errors': 0
    }
    
    try:
        # 读取输入文件
        with open(input_file, 'r', encoding='utf-8-sig', newline='') as infile:
            reader = csv.DictReader(infile)
            fieldnames = reader.fieldnames
            rows = list(reader)
        
        stats['total_rows'] = len(rows)
        
        # 处理每一行数据
        for row in rows:
            stats['processed_rows'] += 1
            row_processed = False
            
            # 处理居住地坐标
            home_lat_empty = is_empty_field(row.get('居住地纬度'))
            home_lng_empty = is_empty_field(row.get('居住地经度'))
            home_address_has_value = not is_empty_field(row.get('居住地地址'))
            
            if (home_lat_empty or home_lng_empty) and home_address_has_value:
                
                print(f"\n处理行 {stats['processed_rows']}: {row.get('姓名')} - 居住地")
                coords = address_to_coordinates(row['居住地地址'])
                
                if coords:
                    row['居住地纬度'] = str(coords['lat'])
                    row['居住地经度'] = str(coords['lng'])
                    stats['home_address_filled'] += 1
                    row_processed = True
                else:
                    stats['errors'] += 1
            
            # 处理工作地坐标
            work_lat_empty = is_empty_field(row.get('工作地纬度'))
            work_lng_empty = is_empty_field(row.get('工作地经度'))
            work_address_has_value = not is_empty_field(row.get('工作地地址'))
            
            if (work_lat_empty or work_lng_empty) and work_address_has_value:
                
                print(f"\n处理行 {stats['processed_rows']}: {row.get('姓名')} - 工作地")
                coords = address_to_coordinates(row['工作地地址'])
                
                if coords:
                    row['工作地纬度'] = str(coords['lat'])
                    row['工作地经度'] = str(coords['lng'])
                    stats['work_address_filled'] += 1
                    row_processed = True
                else:
                    stats['errors'] += 1
            
            # 如果处理了当前行，添加延迟避免API限制
            if row_processed and stats['processed_rows'] < len(rows):
                delay_seconds = API_DELAY_MS / 1000.0
                print(f"[等待] 下一个请求前等待 {delay_seconds} 秒...")
                time.sleep(delay_seconds)
        
        # 写入输出文件
        with open(output_file, 'w', encoding='utf-8-sig', newline='') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        
        print(f"\n[完成] 处理后的文件已保存到: {output_file}")
        
    except FileNotFoundError:
        print(f"[错误] 找不到文件: {input_file}")
        stats['errors'] += 1
    except Exception as e:
        print(f"[错误] 处理CSV时出错: {str(e)}")
        stats['errors'] += 1
    
    return stats

def load_cache():
    """
    从缓存文件加载地理编码缓存
    """
    global geocode_cache
    cache_file = 'geocode_cache.json'
    
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                geocode_cache = json.load(f)
            print(f"[缓存] 从 {cache_file} 加载了 {len(geocode_cache)} 个缓存项")
        except Exception as e:
            print(f"[错误] 加载缓存失败: {str(e)}")

def save_cache():
    """
    将地理编码缓存保存到文件
    """
    cache_file = 'geocode_cache.json'
    
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(geocode_cache, f, ensure_ascii=False, indent=2)
        print(f"[缓存] 已保存 {len(geocode_cache)} 个缓存项到 {cache_file}")
    except Exception as e:
        print(f"[错误] 保存缓存失败: {str(e)}")

def print_stats(stats: Dict):
    """
    打印处理统计信息
    
    Args:
        stats: 统计信息字典
    """
    print("\n===== 处理统计信息 =====")
    print(f"总记录数: {stats['total_rows']}")
    print(f"处理记录数: {stats['processed_rows']}")
    print(f"居住地坐标填充数: {stats['home_address_filled']}")
    print(f"工作地坐标填充数: {stats['work_address_filled']}")
    print(f"错误数: {stats['errors']}")
    print("=======================")

def main():
    """
    主函数
    """
    print("===== CSV地址转坐标填充工具 =====")
    
    # 定义文件路径
    input_file = 'person_in.csv'
    output_file = 'person_out.csv'
    
    print(f"输入文件: {input_file}")
    print(f"输出文件: {output_file}")
    print("\n正在准备处理...")
    
    # 加载缓存
    load_cache()
    
    try:
        # 处理CSV文件
        stats = process_csv(input_file, output_file)
        
        # 打印统计信息
        print_stats(stats)
        
        print("\n处理完成！")
        print(f"原始文件: {input_file}")
        print(f"处理后的文件: {output_file}")
        
    except KeyboardInterrupt:
        print("\n[取消] 用户中断处理")
    finally:
        # 保存缓存
        save_cache()

if __name__ == "__main__":
    main()