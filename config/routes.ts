export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: '登录',
        path: '/user/login',
        component: './User/Login',
      },
    ],
  },
  {
    path: '/',
    redirect: '/overview',
  },
  {
    path: '/overview',
    name: '总览',
    icon: 'safetyCertificate',
    component: './SqlSecurityDemo',
    access: 'menu:overview',
  },
  {
    path: '/sql-security',
    name: 'SQL 安全',
    icon: 'securityScan',
    access: 'menu:sql_security',
    routes: [
      {
        path: '/sql-security',
        redirect: '/sql-security/console',
      },
      {
        path: '/sql-security/console',
        name: 'SQL审核工作台',
        icon: 'fileSearch',
        component: './SqlSecurityDemo/Console',
        access: 'menu:sql_console',
      },
      {
        path: '/sql-security/sql-templates',
        name: 'SQL样例库',
        icon: 'fileText',
        component: './SqlSecurityDemo/SqlTemplates',
        access: 'menu:sql_template',
      },
      {
        path: '/sql-security/approval',
        name: 'DML审批',
        icon: 'fileProtect',
        access: 'menu:approval',
        routes: [
          {
            path: '/sql-security/approval',
            redirect: '/sql-security/approval/list',
          },
          {
            path: '/sql-security/approval/list',
            name: '审批列表',
            icon: 'unorderedList',
            component: './SqlSecurityDemo/Approvals',
            access: 'menu:approval_list',
          },
          {
            path: '/sql-security/approval/executions',
            name: '执行列表',
            icon: 'playCircle',
            component: './SqlSecurityDemo/Approvals/Executions',
            access: 'menu:approval_execution',
          },
        ],
      },
      {
        path: '/sql-security/audit',
        name: '审计日志',
        icon: 'audit',
        component: './SqlSecurityDemo/Audit',
        access: 'menu:audit',
      },
    ],
  },
  {
    path: '/database',
    name: '数据库管理',
    icon: 'database',
    access: 'menu:database',
    routes: [
      {
        path: '/database',
        redirect: '/database/connections',
      },
      {
        path: '/database/connections',
        name: '连接管理',
        icon: 'link',
        component: './SqlSecurityDemo/DataSources/Connections',
        access: 'menu:db_connection',
      },
      {
        path: '/database/connections/create',
        component: './SqlSecurityDemo/DataSources/Connections/ConnectionFormPage',
        hideInMenu: true,
        access: 'db_connection:create',
      },
      {
        path: '/database/connections/detail/:id',
        component: './SqlSecurityDemo/DataSources/Connections/ConnectionDetailPage',
        hideInMenu: true,
        access: 'db_connection:read',
      },
      {
        path: '/database/connections/edit/:id',
        component: './SqlSecurityDemo/DataSources/Connections/ConnectionFormPage',
        hideInMenu: true,
        access: 'db_connection:update',
      },
      {
        path: '/database/drivers',
        name: '驱动管理',
        icon: 'hdd',
        component: './SqlSecurityDemo/DataSources/Drivers',
        access: 'menu:jdbc_driver',
      },
    ],
  },
  {
    path: '/data-security',
    name: '数据安全管理',
    icon: 'control',
    access: 'menu:security_governance',
    routes: [
      {
        path: '/data-security',
        redirect: '/data-security/assets',
      },
      {
        path: '/data-security/assets',
        name: '数据资产与脱敏',
        icon: 'cluster',
        component: './SqlSecurityDemo/Assets',
        access: 'menu:asset',
      },
      {
        path: '/data-security/users',
        name: '用户管理',
        icon: 'user',
        component: './SqlSecurityDemo/Users',
        access: 'menu:user',
      },
      {
        path: '/data-security/permissions',
        name: '权限分配',
        icon: 'userSwitch',
        component: './SqlSecurityDemo/Permissions',
        access: 'menu:role',
      },
      {
        path: '/data-security/permissions/add',
        component: './SqlSecurityDemo/Permissions/PermissionFormPage',
        hideInMenu: true,
        access: 'role:create',
      },
      {
        path: '/data-security/permissions/edit/:id',
        component: './SqlSecurityDemo/Permissions/PermissionFormPage',
        hideInMenu: true,
        access: 'role:update',
      },
      {
        path: '/data-security/permissions/details/:detailsId',
        component: './SqlSecurityDemo/Permissions/PermissionFormPage',
        hideInMenu: true,
        access: 'role:read',
      },
      {
        path: '/data-security/rules',
        name: 'SQL规则策略',
        icon: 'lock',
        component: './SqlSecurityDemo/Rules',
        access: 'menu:rule',
      },
    ],
  },
  {
    path: '*',
    redirect: '/overview',
  },
];
