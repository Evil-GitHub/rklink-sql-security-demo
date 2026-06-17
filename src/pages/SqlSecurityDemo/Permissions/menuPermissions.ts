export type PermissionNode = {
  children?: PermissionNode[];
  key: string;
  title: string;
};

export const PERMISSIONS: PermissionNode[] = [
  {
    title: '总览',
    key: 'menu:overview',
  },
  {
    title: 'SQL 安全',
    key: 'menu:sql_security',
    children: [
      {
        title: 'SQL 审核工作台',
        key: 'menu:sql_console',
        children: [
          { title: '查看', key: 'sql_console:read' },
          { title: '执行审核', key: 'sql_console:execute' },
        ],
      },
      {
        title: 'SQL 样例库',
        key: 'menu:sql_template',
        children: [{ title: '查看样例', key: 'sql_template:read' }],
      },
      {
        title: 'DML 审批',
        key: 'menu:approval',
        children: [
          {
            title: '审批列表',
            key: 'menu:approval_list',
            children: [
              { title: '查看审批', key: 'approval:read' },
              { title: '审批处理', key: 'approval:update' },
            ],
          },
          {
            title: '执行列表',
            key: 'menu:approval_execution',
            children: [{ title: '查看执行', key: 'execution:read' }],
          },
        ],
      },
      {
        title: '审计日志',
        key: 'menu:audit',
        children: [{ title: '查看审计', key: 'audit:read' }],
      },
    ],
  },
  {
    title: '数据库管理',
    key: 'menu:database',
    children: [
      {
        title: '连接管理',
        key: 'menu:db_connection',
        children: [
          { title: '查看连接', key: 'db_connection:read' },
          { title: '创建连接', key: 'db_connection:create' },
          { title: '更新连接', key: 'db_connection:update' },
          { title: '删除连接', key: 'db_connection:delete' },
        ],
      },
      {
        title: '驱动管理',
        key: 'menu:jdbc_driver',
        children: [
          { title: '查看驱动', key: 'jdbc_driver:read' },
          { title: '上传驱动', key: 'jdbc_driver:create' },
          { title: '更新驱动', key: 'jdbc_driver:update' },
          { title: '删除驱动', key: 'jdbc_driver:delete' },
        ],
      },
    ],
  },
  {
    title: '数据安全管理',
    key: 'menu:security_governance',
    children: [
      {
        title: '数据资产与脱敏',
        key: 'menu:asset',
        children: [{ title: '查看资产', key: 'asset:read' }],
      },
      {
        title: 'SQL 规则策略',
        key: 'menu:rule',
        children: [
          { title: '查看规则', key: 'rule:read' },
          { title: '创建规则', key: 'rule:create' },
          { title: '更新规则', key: 'rule:update' },
          { title: '删除规则', key: 'rule:delete' },
        ],
      },
      {
        title: '用户管理',
        key: 'menu:user',
        children: [
          { title: '查看用户', key: 'user:read' },
          { title: '创建用户', key: 'user:create' },
          { title: '更新用户', key: 'user:update' },
          { title: '删除用户', key: 'user:delete' },
          { title: '重置密码', key: 'user:reset_password' },
        ],
      },
      {
        title: '权限分配',
        key: 'menu:role',
        children: [
          { title: '查看角色', key: 'role:read' },
          { title: '创建角色', key: 'role:create' },
          { title: '更新角色', key: 'role:update' },
          { title: '删除角色', key: 'role:delete' },
        ],
      },
    ],
  },
];

export const flattenPermissionKeys = (permissions: PermissionNode[]): string[] =>
  permissions.reduce<string[]>((keys, item) => {
    keys.push(item.key);
    if (item.children?.length) {
      keys.push(...flattenPermissionKeys(item.children));
    }
    return keys;
  }, []);

export const flattenPermissionNodes = (
  permissions: PermissionNode[],
): PermissionNode[] =>
  permissions.reduce<PermissionNode[]>((nodes, item) => {
    nodes.push(item);
    if (item.children?.length) {
      nodes.push(...flattenPermissionNodes(item.children));
    }
    return nodes;
  }, []);

export const PERMISSION_CODES = flattenPermissionKeys(PERMISSIONS);

export const PERMISSION_CODE_SET = new Set(PERMISSION_CODES);

export const PERMISSION_TITLE_MAP = new Map(
  flattenPermissionNodes(PERMISSIONS).map((item) => [item.key, item.title]),
);
