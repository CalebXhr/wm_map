#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
地址转经纬度Python测试脚本
用于测试OpenStreetMap的Nominatim API
"""

import requests
import time
import json
import urllib.parse
from typing import Dict, List, Optional, Tuple, Union

# 地理编码缓存
geocode_cache = {}

class GeocodeError(Exception):
    """地理编码错误异常"""
    pass

def address_to_coordinates(address: str) -> Dict[str, Union[str, float]]:
    """
    使用OpenStreetMap的Nominatim服务将地址转换为经纬度坐标
    
    Args:
        address (str): 要转换的地址
    
    Returns:
        Dict: 包含lat（纬度）、lng（经度）和address（规范化地址）的字典
    
    Raises:
        GeocodeError: 地理编码失败时抛出
    """
    # 检查缓存
    if address in geocode_cache:
        print(f"[缓存命中] {address}")
        return geocode_cache[address]
    
    # 处理空地址
    if not address or address.strip() == '':
        raise GeocodeError("地址不能为空")
    
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
            raise GeocodeError(f"HTTP错误: {response.status_code} - {response.text}")
        
        # 解析JSON响应
        data = response.json()
        
        if data and len(data) > 0:
            location = {
                'lat': float(data[0]['lat']),
                'lng': float(data[0]['lon']),
                'address': data[0].get('display_name', address)
            }
            
            # 存入缓存
            geocode_cache[address] = location
            
            print(f"[成功] {address} -> ({location['lat']}, {location['lng']})")
            return location
        else:
            error_msg = f"未找到地址: {address}"
            print(f"[失败] {error_msg}")
            raise GeocodeError(error_msg)
    
    except requests.exceptions.RequestException as e:
        error_msg = f"网络请求错误: {str(e)}"
        print(f"[错误] {error_msg}")
        raise GeocodeError(error_msg)
    except (ValueError, KeyError) as e:
        error_msg = f"数据解析错误: {str(e)}"
        print(f"[错误] {error_msg}")
        raise GeocodeError(error_msg)

def batch_address_to_coordinates(addresses: List[str], delay_ms: int = 1000) -> List[Dict]:
    """
    批量转换地址为坐标
    
    Args:
        addresses (List[str]): 地址列表
        delay_ms (int): 请求间隔时间（毫秒），默认1000ms
    
    Returns:
        List[Dict]: 包含每个地址转换结果的列表
    """
    results = []
    delay_seconds = delay_ms / 1000.0
    
    print(f"\n开始批量处理 {len(addresses)} 个地址，请求间隔 {delay_ms}ms...")
    
    for i, address in enumerate(addresses):
        try:
            # 转换地址
            coordinates = address_to_coordinates(address)
            results.append({
                'address': address,
                'coordinates': coordinates,
                'success': True
            })
        except GeocodeError as e:
            results.append({
                'address': address,
                'error': str(e),
                'success': False
            })
        
        # 添加延迟避免触发速率限制
        if i < len(addresses) - 1:
            print(f"[等待] 下一个请求前等待 {delay_seconds} 秒...")
            time.sleep(delay_seconds)
    
    return results

def print_batch_results(results: List[Dict]) -> None:
    """
    打印批量处理结果
    
    Args:
        results (List[Dict]): 批量处理结果列表
    """
    success_count = sum(1 for r in results if r['success'])
    error_count = len(results) - success_count
    
    print(f"\n===== 批量处理结果摘要 =====")
    print(f"总地址数: {len(results)}")
    print(f"成功: {success_count}")
    print(f"失败: {error_count}")
    print("==========================")
    
    # 打印详细结果
    print("\n详细结果:")
    for i, result in enumerate(results):
        print(f"\n地址 {i+1}:")
        print(f"  原始地址: {result['address']}")
        
        if result['success']:
            coords = result['coordinates']
            print(f"  规范化地址: {coords['address']}")
            print(f"  纬度 (lat): {coords['lat']}")
            print(f"  经度 (lng): {coords['lng']}")
            print(f"  坐标对: [{coords['lat']}, {coords['lng']}]")
        else:
            print(f"  状态: 失败")
            print(f"  错误: {result['error']}")

def save_results_to_json(results: List[Dict], filename: str = 'geocode_results.json') -> None:
    """
    将结果保存到JSON文件
    
    Args:
        results (List[Dict]): 要保存的结果列表
        filename (str): 输出文件名
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\n结果已保存到: {filename}")
    except Exception as e:
        print(f"\n保存结果失败: {str(e)}")

def run_interactive_test():
    """
    交互式测试函数
    """
    print("===== OpenStreetMap Nominatim 地址转经纬度测试工具 =====")
    print("使用说明:")
    print("1. 输入 '1' 测试单个地址")
    print("2. 输入 '2' 测试批量地址")
    print("3. 输入 '3' 查看缓存信息")
    print("4. 输入 '4' 清除缓存")
    print("5. 输入 'exit' 退出程序")
    print("====================================================")
    
    while True:
        choice = input("\n请选择操作: ").strip().lower()
        
        if choice == 'exit':
            print("谢谢使用，再见！")
            break
        
        elif choice == '1':
            # 单个地址测试
            address = input("请输入要转换的地址: ").strip()
            if not address:
                print("地址不能为空！")
                continue
            
            try:
                print(f"\n正在转换: '{address}'")
                result = address_to_coordinates(address)
                print("\n转换结果:")
                print(f"  原始地址: {address}")
                print(f"  规范化地址: {result['address']}")
                print(f"  纬度 (lat): {result['lat']}")
                print(f"  经度 (lng): {result['lng']}")
                print(f"  坐标对: [{result['lat']}, {result['lng']}]")
            except GeocodeError as e:
                print(f"\n转换失败: {str(e)}")
        
        elif choice == '2':
            # 批量地址测试
            print("请输入多个地址，每行一个（输入空行结束）:")
            addresses = []
            while True:
                line = input().strip()
                if not line:
                    break
                addresses.append(line)
            
            if not addresses:
                print("没有输入地址！")
                continue
            
            delay = input("请输入请求间隔时间(毫秒，默认为1000ms): ").strip()
            delay_ms = int(delay) if delay and delay.isdigit() else 1000
            
            results = batch_address_to_coordinates(addresses, delay_ms)
            print_batch_results(results)
            
            save_choice = input("\n是否保存结果到JSON文件? (y/n): ").strip().lower()
            if save_choice == 'y':
                filename = input("请输入文件名(默认为'geocode_results.json'): ").strip()
                if not filename:
                    filename = 'geocode_results.json'
                save_results_to_json(results, filename)
        
        elif choice == '3':
            # 查看缓存信息
            print(f"\n当前缓存信息:")
            print(f"缓存地址数量: {len(geocode_cache)}")
            if geocode_cache:
                print("缓存内容:")
                for address, location in geocode_cache.items():
                    print(f"  - '{address}' -> ({location['lat']}, {location['lng']})")
        
        elif choice == '4':
            # 清除缓存
            geocode_cache.clear()
            print("\n缓存已清除")
        
        else:
            print("无效的选择，请重新输入！")

def run_demo_test():
    """
    运行演示测试
    """
    print("\n===== 运行演示测试 =====")
    
    # 测试单个地址
    print("\n1. 单个地址测试:")
    demo_addresses = [
        "北京市海淀区中关村大街1号",
        "上海市浦东新区世纪大道1号"
    ]
    
    for address in demo_addresses:
        try:
            result = address_to_coordinates(address)
            print(f"  地址: {address}")
            print(f"  坐标: [{result['lat']}, {result['lng']}]")
        except GeocodeError as e:
            print(f"  地址: {address} - 失败: {str(e)}")
    
    # 测试批量地址
    print("\n2. 批量地址测试:")
    batch_addresses = [
        "广州市天河区天河路",
        "深圳市南山区科技园",
        "杭州市西湖区文三路",
        "不存在的地址123456789"
    ]
    
    results = batch_address_to_coordinates(batch_addresses)
    print_batch_results(results)

if __name__ == "__main__":
    # 首先运行演示测试
    run_demo_test()
    
    # 然后启动交互式测试
    run_interactive_test()