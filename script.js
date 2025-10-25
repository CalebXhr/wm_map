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
    currentView = currentView === 'both' ? 'residence' : 
                  currentView === 'residence' ? 'workplace' : 'both';
    
    updateMarkersVisibility();
    
    // 更新按钮文本
    toggleViewBtn.textContent = getViewButtonText();
}

// 获取视图按钮文本
function getViewButtonText() {
    switch (currentView) {
        case 'residence':
            return '显示工作地点';
        case 'workplace':
            return '显示所有地点';
        default:
            return '只显示居住地';
    }
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
    // 切换视图按钮
    toggleViewBtn.addEventListener('click', toggleView);
    
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
    
    alert('数据导入功能开发中，当前版本使用示例数据。');
    
    // 重置文件输入
    event.target.value = '';
}

// 导出数据
function exportData() {
    alert('数据导出功能开发中。');
}

// 初始化应用
window.addEventListener('DOMContentLoaded', initMap);