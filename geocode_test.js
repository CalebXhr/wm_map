// 独立的地址转经纬度测试脚本
// 这个脚本可以单独运行，也可以在浏览器中通过简单的HTML调用

// 地理编码缓存，避免重复调用API
const geocodeCache = new Map();

/**
 * 使用OpenStreetMap的Nominatim服务将地址转换为经纬度坐标
 * @param {string} address - 要转换的地址
 * @returns {Promise<Object>} - 包含lat和lng的坐标对象
 */
async function addressToCoordinates(address) {
    // 检查缓存
    if (geocodeCache.has(address)) {
        console.log('使用缓存的地理编码结果:', address);
        return geocodeCache.get(address);
    }
    
    // 处理空地址
    if (!address || address.trim() === '') {
        throw new Error('地址不能为空');
    }
    
    try {
        // 编码地址
        const encodedAddress = encodeURIComponent(address);
        
        // Nominatim API请求URL
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&accept-language=zh-CN`;
        
        console.log('正在请求地理编码:', address);
        
        // 发送请求，设置User-Agent以符合Nominatim使用政策
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'wm_map_app/1.0 (employee map application)'
            }
        });
        
        if (!response.ok) {
            throw new Error(`地理编码请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const location = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                address: data[0].display_name || address
            };
            
            // 存入缓存
            geocodeCache.set(address, location);
            
            console.log('地理编码成功:', address, location);
            return location;
        } else {
            console.warn('未找到地址:', address);
            throw new Error(`未找到地址: ${address}`);
        }
    } catch (error) {
        console.error('地理编码出错:', error);
        throw error;
    }
}

/**
 * 批量转换地址为坐标
 * @param {Array<string>} addresses - 地址数组
 * @param {number} delayMs - 请求间隔时间（毫秒），默认1000ms
 * @returns {Promise<Array<Object>>} - 包含地址和坐标的结果数组
 */
async function batchAddressToCoordinates(addresses, delayMs = 1000) {
    const results = [];
    
    for (let i = 0; i < addresses.length; i++) {
        try {
            const address = addresses[i];
            const coordinates = await addressToCoordinates(address);
            results.push({
                address,
                coordinates,
                success: true
            });
        } catch (error) {
            results.push({
                address: addresses[i],
                error: error.message,
                success: false
            });
        }
        
        // 添加延迟避免触发速率限制
        if (i < addresses.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    return results;
}

// 如果在浏览器环境中运行，添加简单的测试界面支持
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // 等待DOM加载完成
    document.addEventListener('DOMContentLoaded', function() {
        // 检查是否存在测试容器，如果没有则创建一个简单的测试界面
        let testContainer = document.getElementById('geocode-test-container');
        
        if (!testContainer) {
            // 创建简单的测试界面
            testContainer = document.createElement('div');
            testContainer.id = 'geocode-test-container';
            testContainer.style.maxWidth = '600px';
            testContainer.style.margin = '0 auto';
            testContainer.style.padding = '20px';
            testContainer.style.fontFamily = 'Arial, sans-serif';
            
            testContainer.innerHTML = `
                <h2>地址转经纬度测试工具</h2>
                
                <!-- 单个地址测试 -->
                <div style="margin-bottom: 30px;">
                    <h3>单个地址测试</h3>
                    <input type="text" id="single-address" placeholder="请输入地址" style="width: 100%; padding: 8px; margin-bottom: 10px;">
                    <button id="convert-btn" style="padding: 8px 16px; background-color: #4285f4; color: white; border: none; cursor: pointer;">
                        转换
                    </button>
                    <div id="single-result" style="margin-top: 15px; padding: 10px; border: 1px solid #ddd; min-height: 100px;">
                        结果将显示在这里
                    </div>
                </div>
                
                <!-- 批量地址测试 -->
                <div>
                    <h3>批量地址测试</h3>
                    <textarea id="batch-addresses" placeholder="请输入多个地址，每行一个" rows="5" style="width: 100%; padding: 8px; margin-bottom: 10px;"></textarea>
                    <button id="batch-convert-btn" style="padding: 8px 16px; background-color: #34a853; color: white; border: none; cursor: pointer;">
                        批量转换
                    </button>
                    <div id="batch-result" style="margin-top: 15px; padding: 10px; border: 1px solid #ddd; min-height: 100px; max-height: 300px; overflow-y: auto;">
                        结果将显示在这里
                    </div>
                </div>
            `;
            
            document.body.appendChild(testContainer);
        }
        
        // 绑定单个地址转换事件
        document.getElementById('convert-btn').addEventListener('click', async function() {
            const address = document.getElementById('single-address').value;
            const resultDiv = document.getElementById('single-result');
            
            if (!address) {
                resultDiv.innerHTML = '<span style="color: red;">请输入地址</span>';
                return;
            }
            
            resultDiv.innerHTML = '正在转换中...';
            
            try {
                const result = await addressToCoordinates(address);
                resultDiv.innerHTML = `
                    <p><strong>地址:</strong> ${result.address}</p>
                    <p><strong>纬度 (lat):</strong> ${result.lat}</p>
                    <p><strong>经度 (lng):</strong> ${result.lng}</p>
                    <p><strong>坐标:</strong> [${result.lat}, ${result.lng}]</p>
                `;
            } catch (error) {
                resultDiv.innerHTML = `<span style="color: red;">错误: ${error.message}</span>`;
            }
        });
        
        // 绑定批量地址转换事件
        document.getElementById('batch-convert-btn').addEventListener('click', async function() {
            const addressesText = document.getElementById('batch-addresses').value;
            const resultDiv = document.getElementById('batch-result');
            
            if (!addressesText) {
                resultDiv.innerHTML = '<span style="color: red;">请输入地址</span>';
                return;
            }
            
            const addresses = addressesText.split('\n')
                .map(line => line.trim())
                .filter(line => line !== '');
            
            resultDiv.innerHTML = `正在转换 ${addresses.length} 个地址，请稍候...`;
            
            try {
                const results = await batchAddressToCoordinates(addresses);
                
                // 显示结果
                let html = '<h4>转换结果:</h4>';
                results.forEach((result, index) => {
                    if (result.success) {
                        html += `
                            <div style="margin-bottom: 15px; padding: 10px; background-color: #f1f8e9;">
                                <p><strong>地址:</strong> ${result.address}</p>
                                <p><strong>纬度:</strong> ${result.coordinates.lat}</p>
                                <p><strong>经度:</strong> ${result.coordinates.lng}</p>
                            </div>
                        `;
                    } else {
                        html += `
                            <div style="margin-bottom: 15px; padding: 10px; background-color: #ffebee;">
                                <p><strong>地址:</strong> ${result.address}</p>
                                <p><strong>错误:</strong> ${result.error}</p>
                            </div>
                        `;
                    }
                });
                
                resultDiv.innerHTML = html;
            } catch (error) {
                resultDiv.innerHTML = `<span style="color: red;">错误: ${error.message}</span>`;
            }
        });
        
        // 添加键盘事件
        document.getElementById('single-address').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('convert-btn').click();
            }
        });
    });
}

// 导出函数以便其他脚本使用
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
        addressToCoordinates,
        batchAddressToCoordinates
    };
}

// 简单的测试示例（如果直接运行此脚本）
if (typeof window === 'undefined') {
    // 在Node.js环境中运行时的测试
    console.log('这是一个地址转经纬度的独立测试脚本');
    console.log('使用方法:');
    console.log('1. 浏览器环境: 引入此脚本到HTML页面');
    console.log('2. Node.js环境: const { addressToCoordinates } = require(\'./geocode_test.js\');');
    console.log('3. 直接调用: await addressToCoordinates(\'北京市海淀区\')');
}