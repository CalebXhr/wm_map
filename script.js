// 使用全局变量employeeData（从data.js加载）

// 全局变量
let map;
let residenceMarkers = [];
let workplaceMarkers = [];
let currentView = 'both'; // 'residence', 'workplace', 'both'
let allMarkers = [];

// DOM 元素
const toggleViewBtn = document.getElementById('toggleView');
const showAllBtn = document.getElementById('showAll');
const filterDepartment = document.getElementById('filterDepartment');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const employeeInfo = document.getElementById('employeeInfo');
const importDataBtn = document.getElementById('importData');
const exportDataBtn = document.getElementById('exportData');
const fileInput = document.getElementById('fileInput');

// 初始化地图
function initMap() {
    // 创建地图实例，中心设为北京
    map = L.map('map').setView([39.9042, 116.4074], 11);
    
    // 添加OpenStreetMap图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // 初始化标记
    initMarkers();
    
    // 绑定事件监听器
    bindEventListeners();
}

// 初始化标记
function initMarkers() {
    employeeData.forEach(employee => {
        // 居住地点标记
        const residenceIcon = L.divIcon({
            className: 'residence-icon',
            html: `<div style="width: 24px; height: 24px; border-radius: 50%; background-color: #48bb78; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">家</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        const residenceMarker = L.marker([employee.residence.lat, employee.residence.lng], {
            icon: residenceIcon
        }).addTo(map);
        
        // 工作地点标记
        const workplaceIcon = L.divIcon({
            className: 'workplace-icon',
            html: `<div style="width: 24px; height: 24px; border-radius: 50%; background-color: #f56565; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">公</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        const workplaceMarker = L.marker([employee.workplace.lat, employee.workplace.lng], {
            icon: workplaceIcon
        }).addTo(map);
        
        // 绑定点击事件
        bindMarkerEvents(residenceMarker, employee, 'residence');
        bindMarkerEvents(workplaceMarker, employee, 'workplace');
        
        // 存储标记
        residenceMarkers.push(residenceMarker);
        workplaceMarkers.push(workplaceMarker);
        allMarkers.push(residenceMarker, workplaceMarker);
    });
}

// 绑定标记事件
function bindMarkerEvents(marker, employee, type) {
    marker.on('click', () => {
        // 显示员工信息
        displayEmployeeInfo(employee, type);
        
        // 添加连线显示通勤路线
        const otherType = type === 'residence' ? 'workplace' : 'residence';
        const startLatLng = [employee[type].lat, employee[type].lng];
        const endLatLng = [employee[otherType].lat, employee[otherType].lng];
        
        // 移除之前的连线
        removeAllPolylines();
        
        // 添加新连线
        L.polyline([startLatLng, endLatLng], {
            color: '#667eea',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(map);
        
        // 弹出信息框
        marker.bindPopup(`<b>${employee.name}</b><br>${type === 'residence' ? '居住地' : '工作地'}: ${employee[type].address}`).openPopup();
    });
}

// 显示员工信息
function displayEmployeeInfo(employee, type) {
    const html = `
        <div>
            <p><strong>姓名:</strong> ${employee.name}</p>
            <p><strong>部门:</strong> ${employee.department}</p>
            <p><strong>职位:</strong> ${employee.position}</p>
            <p><strong>入职日期:</strong> ${employee.joinDate}</p>
            <p><strong>居住地:</strong> ${employee.residence.address}</p>
            <p><strong>工作地:</strong> ${employee.workplace.address}</p>
            <p><strong>当前查看:</strong> ${type === 'residence' ? '居住地' : '工作地'}</p>
        </div>
    `;
    
    employeeInfo.innerHTML = html;
}

// 移除所有连线
function removeAllPolylines() {
    map.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
}

// 切换视图
function toggleView() {
    currentView = toggleViewBtn.value;
    
    updateMarkersVisibility();
    
    // 添加提示信息
    let message = '';
    switch (currentView) {
        case 'residence':
            message = '当前只显示员工居住地点';
            break;
        case 'workplace':
            message = '当前只显示员工工作地点';
            break;
        default:
            message = '当前显示所有员工地点（居住和工作）';
    }
    
    // 显示临时提示
    showTemporaryMessage(message);
}

// 显示临时消息提示
function showTemporaryMessage(message) {
    // 创建消息元素
    let messageEl = document.createElement('div');
    messageEl.className = 'message-toast';
    messageEl.textContent = message;
    messageEl.style.position = 'fixed';
    messageEl.style.bottom = '20px';
    messageEl.style.left = '50%';
    messageEl.style.transform = 'translateX(-50%)';
    messageEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    messageEl.style.color = 'white';
    messageEl.style.padding = '12px 24px';
    messageEl.style.borderRadius = '8px';
    messageEl.style.zIndex = '10000';
    messageEl.style.fontSize = '14px';
    messageEl.style.opacity = '0';
    messageEl.style.transition = 'opacity 0.3s ease';
    
    // 添加到文档
    document.body.appendChild(messageEl);
    
    // 显示消息
    setTimeout(() => {
        messageEl.style.opacity = '1';
    }, 10);
    
    // 2秒后隐藏并移除
    setTimeout(() => {
        messageEl.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 300);
    }, 2000);
}

// 更新标记可见性
function updateMarkersVisibility() {
    // 首先应用视图过滤
    residenceMarkers.forEach(marker => {
        marker.removeFrom(map);
    });
    
    workplaceMarkers.forEach(marker => {
        marker.removeFrom(map);
    });
    
    if (currentView === 'residence' || currentView === 'both') {
        residenceMarkers.forEach(marker => {
            map.addLayer(marker);
        });
    }
    
    if (currentView === 'workplace' || currentView === 'both') {
        workplaceMarkers.forEach(marker => {
            map.addLayer(marker);
        });
    }
    
    // 然后应用部门和搜索过滤
    applyFilters();
}

// 应用过滤条件
function applyFilters() {
    const selectedDepartment = filterDepartment.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    allMarkers.forEach((marker, index) => {
        // 根据索引找到对应的员工
        const employeeIndex = Math.floor(index / 2);
        const employee = employeeData[employeeIndex];
        
        // 检查部门过滤
        const departmentMatch = selectedDepartment === 'all' || employee.department === selectedDepartment;
        
        // 检查搜索过滤
        const searchMatch = searchTerm === '' || 
                           employee.name.toLowerCase().includes(searchTerm) ||
                           employee.department.toLowerCase().includes(searchTerm) ||
                           employee.position.toLowerCase().includes(searchTerm);
        
        // 更新标记可见性
        if (departmentMatch && searchMatch && map.hasLayer(marker)) {
            marker.addTo(map);
        } else {
            marker.removeFrom(map);
        }
    });
}

// 显示所有标记
function showAllMarkers() {
    // 重置过滤器
    filterDepartment.value = 'all';
    searchInput.value = '';
    
    // 显示所有标记
    allMarkers.forEach(marker => {
        if (!map.hasLayer(marker)) {
            map.addLayer(marker);
        }
    });
    
    // 调整地图视野以显示所有标记
    const bounds = L.latLngBounds();
    allMarkers.forEach(marker => {
        bounds.extend(marker.getLatLng());
    });
    
    if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // 清空员工信息面板
    employeeInfo.innerHTML = '<p>点击地图上的标记查看详细信息</p>';
    
    // 移除所有连线
    removeAllPolylines();
}

// 绑定事件监听器
function bindEventListeners() {
    // 切换视图下拉列表
    toggleViewBtn.addEventListener('change', toggleView);
    
    // 显示所有标记按钮
    showAllBtn.addEventListener('click', showAllMarkers);
    
    // 部门过滤
    filterDepartment.addEventListener('change', applyFilters);
    
    // 搜索
    searchBtn.addEventListener('click', applyFilters);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    // 导入数据
    importDataBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileImport);
    
    // 导出数据
    exportDataBtn.addEventListener('click', exportData);
    
    // 地图点击事件 - 清空选中状态
    map.on('click', (e) => {
        if (!e.originalEvent.target.closest('.leaflet-marker-icon')) {
            removeAllPolylines();
        }
    });
}

// 处理文件导入
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('请上传CSV格式的文件！');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const csvContent = e.target.result;
            const parsedData = parseCSVData(csvContent);
            
            if (parsedData.length === 0) {
                alert('未导入任何员工数据，请检查文件格式是否正确！');
                return;
            }
            
            // 更新全局员工数据
            window.employeeData = parsedData;
            
            // 清除现有标记并重新初始化
            clearAllMarkers();
            initMarkers();
            applyFilters();
            
            alert(`成功导入 ${parsedData.length} 条员工数据！`);
        } catch (error) {
            console.error('导入数据时出错:', error);
            alert('导入失败，请检查文件格式是否正确！错误信息：' + error.message);
        }
    };
    
    reader.onerror = function() {
        alert('读取文件失败，请重试！');
    };
    
    // 读取文件内容
    reader.readAsText(file, 'UTF-8');
    
    // 重置文件输入
    event.target.value = '';
}

// 解析CSV数据
function parseCSVData(csvContent) {
    const lines = csvContent.split('\n');
    const result = [];
    
    if (lines.length < 2) {
        throw new Error('CSV文件内容太少');
    }
    
    // 获取标题行并标准化（去除空格和引号）
    const headers = lines[0].split(',').map(h => 
        h.replace(/^"|"$/g, '').trim().toLowerCase()
    );
    
    // 检查必要的字段
    const requiredFields = ['id', '姓名', '部门', '职位'];
    const hasRequiredFields = requiredFields.some(field => 
        headers.some(header => header.includes(field))
    );
    
    if (!hasRequiredFields) {
        throw new Error('CSV文件缺少必要的字段，请确保包含ID、姓名、部门、职位等信息');
    }
    
    // 处理数据行
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // 使用正则表达式正确解析CSV行，处理引号内的逗号
        const row = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        row.push(current.trim());
        
        // 创建员工对象
        const employee = {
            id: parseInt(row[0]) || Date.now() + i, // 如果ID无效，使用时间戳+索引
            name: row[1] || '未知',
            department: row[2] || '未分类',
            position: row[3] || '未知',
            residence: {
                name: '家',
                address: row[4] || '未知地址',
                lat: parseFloat(row[5]) || 39.9042, // 默认北京坐标
                lng: parseFloat(row[6]) || 116.4074
            },
            workplace: {
                name: '公司',
                address: row[7] || '未知地址',
                lat: parseFloat(row[8]) || 39.9042,
                lng: parseFloat(row[9]) || 116.4074
            },
            joinDate: row[10] || new Date().toISOString().split('T')[0]
        };
        
        // 验证必要字段
        if (!employee.name || !employee.department) {
            console.warn('跳过无效行:', row);
            continue;
        }
        
        result.push(employee);
    }
    
    return result;
}

// 清除所有标记
function clearAllMarkers() {
    // 清除居住地点标记
    residenceMarkers.forEach(marker => map.removeLayer(marker));
    residenceMarkers = [];
    
    // 清除工作地点标记
    workplaceMarkers.forEach(marker => map.removeLayer(marker));
    workplaceMarkers = [];
    
    // 清空所有标记数组
    allMarkers = [];
    
    // 移除所有连线
    removeAllPolylines();
}

// 导出数据
function exportData() {
    // 准备CSV数据
    let csvContent = 'ID,姓名,部门,职位,居住地地址,居住地纬度,居住地经度,工作地地址,工作地纬度,工作地经度,入职日期\n';
    
    // 将员工数据转换为CSV格式
    employeeData.forEach(employee => {
        const row = [
            employee.id,
            `"${employee.name}"`,
            `"${employee.department}"`,
            `"${employee.position}"`,
            `"${employee.residence.address}"`,
            employee.residence.lat,
            employee.residence.lng,
            `"${employee.workplace.address}"`,
            employee.workplace.lat,
            employee.workplace.lng,
            employee.joinDate
        ];
        csvContent += row.join(',') + '\n';
    });
    
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 创建下载链接
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `员工数据_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    
    // 添加到DOM并触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 释放URL对象
    URL.revokeObjectURL(url);
}

// 初始化应用
window.addEventListener('DOMContentLoaded', initMap);