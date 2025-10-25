// 员工数据 - 包含居住地点和工作地点信息
// 使用全局变量替代ES模块导出，以兼容普通HTTP服务器
window.employeeData = [
    {
        id: 1,
        name: "张三",
        department: "技术部",
        position: "前端开发工程师",
        residence: {
            name: "家",
            address: "北京市海淀区中关村南大街5号",
            lat: 39.9607,
            lng: 116.3413
        },
        workplace: {
            name: "总部办公室",
            address: "北京市朝阳区建国路88号",
            lat: 39.9087,
            lng: 116.4660
        },
        joinDate: "2022-01-15"
    },
    {
        id: 2,
        name: "李四",
        department: "市场部",
        position: "市场经理",
        residence: {
            name: "家",
            address: "北京市丰台区丰台南路12号",
            lat: 39.8458,
            lng: 116.2865
        },
        workplace: {
            name: "市场中心",
            address: "北京市海淀区中关村大街1号",
            lat: 39.9834,
            lng: 116.3074
        },
        joinDate: "2021-08-20"
    },
    {
        id: 3,
        name: "王五",
        department: "技术部",
        position: "后端开发工程师",
        residence: {
            name: "家",
            address: "北京市西城区西单北大街120号",
            lat: 39.9114,
            lng: 116.3662
        },
        workplace: {
            name: "研发中心",
            address: "北京市海淀区科学院南路2号",
            lat: 39.9812,
            lng: 116.3131
        },
        joinDate: "2022-03-10"
    },
    {
        id: 4,
        name: "赵六",
        department: "行政部",
        position: "行政助理",
        residence: {
            name: "家",
            address: "北京市东城区东直门外大街42号",
            lat: 39.9455,
            lng: 116.4482
        },
        workplace: {
            name: "总部办公室",
            address: "北京市朝阳区建国路88号",
            lat: 39.9087,
            lng: 116.4660
        },
        joinDate: "2021-11-05"
    },
    {
        id: 5,
        name: "孙七",
        department: "财务部",
        position: "财务专员",
        residence: {
            name: "家",
            address: "北京市昌平区回龙观东大街336号",
            lat: 40.0784,
            lng: 116.3349
        },
        workplace: {
            name: "财务中心",
            address: "北京市西城区金融大街35号",
            lat: 39.9075,
            lng: 116.3586
        },
        joinDate: "2022-02-28"
    },
    {
        id: 6,
        name: "周八",
        department: "技术部",
        position: "UI设计师",
        residence: {
            name: "家",
            address: "北京市通州区运河东路66号",
            lat: 39.9000,
            lng: 116.6561
        },
        workplace: {
            name: "创意设计中心",
            address: "北京市朝阳区酒仙桥路4号",
            lat: 39.9800,
            lng: 116.4727
        },
        joinDate: "2022-05-15"
    },
    {
        id: 7,
        name: "吴九",
        department: "市场部",
        position: "营销策划",
        residence: {
            name: "家",
            address: "北京市石景山区石景山路22号",
            lat: 39.9052,
            lng: 116.1871
        },
        workplace: {
            name: "市场中心",
            address: "北京市海淀区中关村大街1号",
            lat: 39.9834,
            lng: 116.3074
        },
        joinDate: "2021-07-10"
    },
    {
        id: 8,
        name: "郑十",
        department: "技术部",
        position: "产品经理",
        residence: {
            name: "家",
            address: "北京市大兴区黄村西大街35号",
            lat: 39.7368,
            lng: 116.3282
        },
        workplace: {
            name: "产品中心",
            address: "北京市朝阳区望京SOHO T1",
            lat: 39.9952,
            lng: 116.4822
        },
        joinDate: "2022-04-01"
    }
];