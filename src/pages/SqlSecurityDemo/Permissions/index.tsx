import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import {
  RKConfirmAction,
  RKTable,
  createRKTableConditionRequestParamsFormatter,
  type RKTableConditionRequestParams,
  type RKTableRequestCondition,
} from '@rklink/components';
import { history, useAccess } from '@umijs/max';
import { App, Button, Space, Switch, Tag } from 'antd';
import type { Key, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  dataSources,
  platformFunctionLabel,
  sourceTypeLabel,
  type PlatformFunction,
} from '../mock';
import {
  deletePermissionRoles,
  readPermissionRoles,
  updatePermissionRoleStatus,
  type PermissionRole,
} from '../permissionRoleStore';
import {
  getPermissionCodesByPlatformPermissions,
  getPlatformPermissionsByPermissionCodes,
} from '../routePermissions';
import { readDemoUserAccounts } from '../userStore';

const ROLE_ROUTE_PREFIX = '/data-security/permissions';

const roleStatusValueEnum = {
  enabled: { text: '启用', status: 'Success' },
  disabled: { text: '停用', status: 'Default' },
};

const ROLE_LIST_CONDITIONS = {
  name: 'like',
  status: 'eq',
} as const;

const toStringIds = (keys: Key[] = []) => keys.map(String).filter(Boolean);

const getConditionValue = (
  conditions: RKTableRequestCondition[] = [],
  field: string,
) => conditions.find((item) => item.field === field)?.value;

const filterText = (value: string | undefined, keyword: unknown) => {
  const text = String(keyword || '').trim().toLowerCase();
  if (!text) return true;
  return String(value || '').toLowerCase().includes(text);
};

const renderLimitedTags = (items: { key: string; label: string }[], limit = 3) => {
  const visibleItems = items.slice(0, limit);
  const restCount = items.length - visibleItems.length;

  return (
    <Space size={[0, 4]} wrap>
      {visibleItems.map((item) => (
        <Tag key={item.key}>{item.label}</Tag>
      ))}
      {restCount > 0 && <Tag>+{restCount}</Tag>}
    </Space>
  );
};

const getRolePlatformPermissions = (role: PermissionRole) =>
  getPlatformPermissionsByPermissionCodes(
    role.permissionCodes?.length
      ? role.permissionCodes
      : getPermissionCodesByPlatformPermissions(role.platformPermissions || []),
  );

const Permissions = () => {
  const { message } = App.useApp();
  const access = useAccess() as Record<string, boolean>;
  const actionRef = useRef<ActionType>();
  const [statusLoadingId, setStatusLoadingId] = useState<string>();
  const canCreateRole = access['role:create'];
  const canReadRole = access['role:read'];
  const canUpdateRole = access['role:update'];
  const canDeleteRole = access['role:delete'];

  const userNameMap = useMemo(
    () =>
      new Map(
        readDemoUserAccounts().map((user) => [
          user.id,
          `${user.name} / ${user.account}`,
        ]),
      ),
    [],
  );
  const sourceNameMap = useMemo(
    () =>
      new Map(
        dataSources.map((source) => [
          source.id,
          `${source.name} / ${sourceTypeLabel[source.dbType]}`,
        ]),
      ),
    [],
  );

  const reloadTable = () => {
    actionRef.current?.reload();
  };

  const deleteRoles = async (roleIds: string[]) => {
    deletePermissionRoles(roleIds);
    return { code: 200 };
  };

  const queryRoles = async (params: RKTableConditionRequestParams) => {
    const pageNum = Number(params.pageNum || 1);
    const pageSize = Number(params.pageSize || 10);
    const conditions = params.conditions || [];
    const name = getConditionValue(conditions, 'name');
    const status = getConditionValue(conditions, 'status');
    const rows = readPermissionRoles().filter(
      (role) =>
        filterText(role.name, name) &&
        (!status || role.status === status),
    );
    const start = (pageNum - 1) * pageSize;

    return {
      code: 200,
      data: rows.slice(start, start + pageSize),
      total: rows.length,
    };
  };

  const handleStatusChange = async (record: PermissionRole) => {
    setStatusLoadingId(record.id);
    try {
      updatePermissionRoleStatus(
        record.id,
        record.status === 'enabled' ? 'disabled' : 'enabled',
      );
      reloadTable();
      message.success('操作成功');
    } finally {
      setStatusLoadingId(undefined);
    }
  };

  const renderRoleActions = (entity: PermissionRole) => {
    const actions: ReactNode[] = [];

    if (canUpdateRole) {
      actions.push(
        <Button
          key="edit"
          size="small"
          type="link"
          onClick={() => history.push(`${ROLE_ROUTE_PREFIX}/edit/${entity.id}`)}
        >
          编辑
        </Button>,
      );
    }

    if (canDeleteRole) {
      actions.push(
        <RKConfirmAction
          key="delete"
          size="small"
          request={() => deleteRoles([entity.id])}
          confirm={{
            title: '确认删除',
            content: `确认删除角色 ${entity.name} 吗？`,
          }}
          successMessage="删除成功"
          onSuccess={reloadTable}
        >
          删除
        </RKConfirmAction>,
      );
    }

    return actions.length ? actions : '-';
  };

  const columns: ProColumns<PermissionRole>[] = [
    {
      title: '角色',
      dataIndex: 'name',
      width: 180,
      render: (dom, entity) =>
        canReadRole ? (
          <Button
            size="small"
            type="link"
            onClick={() =>
              history.push(`${ROLE_ROUTE_PREFIX}/details/${entity.id}`)
            }
          >
            {dom}
          </Button>
        ) : (
          dom
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: roleStatusValueEnum,
      width: 120,
      render: (_, entity) => (
        <Switch
          checked={entity.status === 'enabled'}
          disabled={!canUpdateRole}
          loading={statusLoadingId === entity.id}
          onChange={() => handleStatusChange(entity)}
        />
      ),
    },
    {
      title: '成员',
      dataIndex: 'userIds',
      width: 260,
      search: false,
      render: (_, entity) =>
        renderLimitedTags(
          entity.userIds.map((userId) => ({
            key: userId,
            label: userNameMap.get(userId) || userId,
          })),
          2,
        ),
    },
    {
      title: '业务模块',
      dataIndex: 'permissionCodes',
      width: 260,
      search: false,
      render: (_, entity) =>
        renderLimitedTags(
          getRolePlatformPermissions(entity).map((key) => ({
            key,
            label: platformFunctionLabel[key as PlatformFunction],
          })),
          3,
        ),
    },
    {
      title: '数据源范围',
      dataIndex: 'allowedSources',
      width: 300,
      search: false,
      render: (_, entity) =>
        renderLimitedTags(
          (entity.allowedSources || []).map((sourceId) => ({
            key: sourceId,
            label: sourceNameMap.get(sourceId) || sourceId,
          })),
          2,
        ),
    },
    {
      title: 'SQL 操作',
      dataIndex: 'operations',
      width: 170,
      search: false,
      render: (_, entity) =>
        renderLimitedTags(
          (entity.operations || []).map((operation) => ({
            key: operation,
            label: operation.toUpperCase(),
          })),
          4,
        ),
    },
    {
      title: '审批策略',
      dataIndex: 'dmlApprovalMode',
      width: 220,
      ellipsis: true,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_, entity) => renderRoleActions(entity),
    },
  ];

  return (
    <PageContainer header={{ title: false }}>
      <RKTable<
        PermissionRole,
        Record<string, unknown>,
        'text',
        RKTableConditionRequestParams
      >
        actionRef={actionRef}
        rowKey="id"
        headerTitle="角色列表"
        columns={columns}
        batchActions={
          canDeleteRole
            ? [
                {
                  key: 'delete',
                  label: '批量删除',
                  danger: true,
                  request: ({ selectedRowKeys }) =>
                    deleteRoles(toStringIds(selectedRowKeys)),
                  confirm: ({ selectedRows }) => ({
                    title: '确认删除',
                    content: `确认删除角色 ${selectedRows
                      .map((item) => item.name)
                      .join(',')} 吗？`,
                  }),
                  successMessage: '删除成功',
                  reloadOnSuccess: true,
                  clearSelectedOnSuccess: true,
                },
              ]
            : []
        }
        requestApi={queryRoles}
        requestParamsFormatter={createRKTableConditionRequestParamsFormatter(
          ROLE_LIST_CONDITIONS,
        )}
        defaultPageSize={10}
        search={{ labelWidth: 80 }}
        scroll={{ x: 1660 }}
        toolBarRender={
          canCreateRole
            ? () => [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => history.push(`${ROLE_ROUTE_PREFIX}/add`)}
                >
                  新建
                </Button>,
              ]
            : undefined
        }
      />
    </PageContainer>
  );
};

export default Permissions;
