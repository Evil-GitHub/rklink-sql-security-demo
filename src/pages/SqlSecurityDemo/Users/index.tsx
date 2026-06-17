import { FORM_COL_FULL } from "@/utils/formLayout";
import { PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import {
  DrawerForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import {
  RKConfirmAction,
  RKTable,
  createRKTableConditionRequestParamsFormatter,
  type RKTableConditionRequestParams,
  type RKTableRequestCondition,
} from "@rklink/components";
import { useAccess } from "@umijs/max";
import { App, Button, Space, Switch, Tag, Typography } from "antd";
import type { Key, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { readCurrentDemoUserId } from "../currentUserStore";
import {
  dataSources,
  platformFunctionLabel,
  sourceTypeLabel,
  type DemoUser,
  type PlatformFunction,
} from "../mock";
import {
  readPermissionRoles,
  syncAllRolePermissionsToUsers,
  updateUserPermissionRoles,
} from "../permissionRoleStore";
import { readDemoUsersWithPermissions } from "../permissionStore";
import {
  createDemoUserAccount,
  deleteDemoUserAccounts,
  readDemoUserAccounts,
  updateDemoUserAccount,
  updateDemoUserStatus,
  type DemoUserPayload,
} from "../userStore";

type DemoUserFormValues = Pick<
  DemoUserPayload,
  | "account"
  | "name"
  | "department"
  | "employeeNo"
  | "position"
  | "status"
  | "dataScope"
  | "fieldScope"
> & {
  roleIds: string[];
};

const { Text } = Typography;

const USER_LIST_CONDITIONS = {
  name: "like",
  account: "like",
  department: "like",
  status: "eq",
} as const;

const userStatusValueEnum = {
  在职: { text: "在职", status: "Success" },
  锁定: { text: "锁定", status: "Default" },
};

const userStatusOptions: { label: string; value: DemoUser["status"] }[] = [
  { label: "在职", value: "在职" },
  { label: "锁定", value: "锁定" },
];

const departmentOptions = [
  "数字银行研发部",
  "基础平台运维部",
  "数据库平台组",
  "信息安全与合规部",
  "人力资源薪酬组",
  "风险控制模型组",
  "核心账务运营部",
  "数据治理部",
  "业务运营部",
].map((value) => ({ label: value, value }));

const positionOptions = [
  "后端开发工程师",
  "生产变更工程师",
  "数据库管理员",
  "安全审计专员",
  "薪酬专员",
  "风控数据分析师",
  "账务复核员",
  "数据治理专员",
  "业务运营专员",
].map((value) => ({ label: value, value }));

const defaultUserValues: DemoUserFormValues = {
  account: "",
  name: "",
  department: "",
  employeeNo: "",
  position: "",
  roleIds: [],
  status: "在职",
  dataScope: "未分配角色；仅保留总览访问",
  fieldScope: "未授权业务字段",
};

const toStringIds = (keys: Key[] = []) => keys.map(String).filter(Boolean);

const getConditionValue = (
  conditions: RKTableRequestCondition[] = [],
  field: string,
) => conditions.find((item) => item.field === field)?.value;

const filterText = (value: string | undefined, keyword: unknown) => {
  const text = String(keyword || "")
    .trim()
    .toLowerCase();
  if (!text) return true;

  return String(value || "")
    .toLowerCase()
    .includes(text);
};

const renderLimitedTags = (
  items: { key: string; label: string }[],
  limit = 3,
) => {
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

const toFormValues = (user?: DemoUser): DemoUserFormValues => {
  if (!user) return defaultUserValues;

  return {
    account: user.account,
    name: user.name,
    department: user.department,
    employeeNo: user.employeeNo,
    position: user.position,
    roleIds: readPermissionRoles()
      .filter((role) => role.userIds.includes(user.id))
      .map((role) => role.id),
    status: user.status,
    dataScope: user.dataScope,
    fieldScope: user.fieldScope,
  };
};

const toPayload = (
  values: DemoUserFormValues,
  roleName: string,
): DemoUserPayload => ({
  account: String(values.account || "").trim(),
  name: String(values.name || "").trim(),
  department: String(values.department || "").trim(),
  employeeNo: String(values.employeeNo || "").trim(),
  position: String(values.position || "").trim(),
  role: roleName,
  status: values.status || "在职",
  dataScope: String(values.dataScope || "").trim(),
  fieldScope: String(values.fieldScope || "").trim(),
});

const Users = () => {
  const { message } = App.useApp();
  const access = useAccess() as Record<string, boolean>;
  const actionRef = useRef<ActionType>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DemoUser>();
  const [statusLoadingId, setStatusLoadingId] = useState<string>();
  const currentUserId = readCurrentDemoUserId();
  const canCreateUser = access["user:create"];
  const canUpdateUser = access["user:update"];
  const canDeleteUser = access["user:delete"];
  const canResetPassword = access["user:reset_password"];
  const roleOptions = useMemo(
    () =>
      readPermissionRoles().map((role) => ({
        label: role.name,
        value: role.id,
      })),
    [drawerOpen],
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

  const getRoleTags = (userId: string) =>
    readPermissionRoles()
      .filter((role) => role.userIds.includes(userId))
      .map((role) => ({ key: role.id, label: role.name }));

  const deleteUsers = async (userIds: string[]) => {
    const deletableUserIds = userIds.filter(
      (userId) => userId !== currentUserId,
    );

    if (deletableUserIds.length !== userIds.length) {
      message.warning("当前登录用户不能删除");
    }

    if (!deletableUserIds.length) return { code: 200 };

    deleteDemoUserAccounts(deletableUserIds);
    syncAllRolePermissionsToUsers();
    return { code: 200 };
  };

  const queryUsers = async (params: RKTableConditionRequestParams) => {
    const pageNum = Number(params.pageNum || 1);
    const pageSize = Number(params.pageSize || 10);
    const conditions = params.conditions || [];
    const name = getConditionValue(conditions, "name");
    const account = getConditionValue(conditions, "account");
    const department = getConditionValue(conditions, "department");
    const status = getConditionValue(conditions, "status");
    const rows = readDemoUsersWithPermissions().filter(
      (user) =>
        filterText(user.name, name) &&
        filterText(user.account, account) &&
        filterText(user.department, department) &&
        (!status || user.status === status),
    );
    const start = (pageNum - 1) * pageSize;

    return {
      code: 200,
      data: rows.slice(start, start + pageSize),
      total: rows.length,
    };
  };

  const handleStatusChange = async (record: DemoUser) => {
    if (record.id === currentUserId) {
      message.warning("当前登录用户不能锁定");
      return;
    }

    setStatusLoadingId(record.id);
    try {
      updateDemoUserStatus(
        record.id,
        record.status === "在职" ? "锁定" : "在职",
      );
      syncAllRolePermissionsToUsers();
      reloadTable();
      message.success("操作成功");
    } finally {
      setStatusLoadingId(undefined);
    }
  };

  const openCreateDrawer = () => {
    setEditingUser(undefined);
    setDrawerOpen(true);
  };

  const openEditDrawer = (user: DemoUser) => {
    setEditingUser(user);
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: DemoUserFormValues) => {
    const selectedRoleIds = values.roleIds || [];
    const selectedRoleNames = roleOptions
      .filter((role) => selectedRoleIds.includes(String(role.value)))
      .map((role) => role.label);
    const payload = toPayload(values, selectedRoleNames[0] || "待分配角色");

    if (!payload.account) {
      message.warning("请输入登录账号");
      return false;
    }
    if (!payload.name) {
      message.warning("请输入用户姓名");
      return false;
    }
    if (!selectedRoleIds.length) {
      message.warning("请选择权限角色");
      return false;
    }

    const duplicateAccount = readDemoUserAccounts().some(
      (user) => user.account === payload.account && user.id !== editingUser?.id,
    );
    const duplicateEmployeeNo = readDemoUserAccounts().some(
      (user) =>
        user.employeeNo === payload.employeeNo &&
        user.employeeNo &&
        user.id !== editingUser?.id,
    );

    if (duplicateAccount) {
      message.warning("登录账号已存在");
      return false;
    }
    if (duplicateEmployeeNo) {
      message.warning("员工编号已存在");
      return false;
    }

    if (editingUser) {
      updateDemoUserAccount(editingUser.id, payload);
      updateUserPermissionRoles(editingUser.id, selectedRoleIds);
    } else {
      const user = createDemoUserAccount(payload);
      updateUserPermissionRoles(user.id, selectedRoleIds);
    }

    message.success("保存成功");
    setDrawerOpen(false);
    reloadTable();
    return true;
  };

  const renderUserActions = (entity: DemoUser) => {
    const actions: ReactNode[] = [];

    if (canUpdateUser) {
      actions.push(
        <Button
          key="edit"
          size="small"
          type="link"
          onClick={() => openEditDrawer(entity)}
        >
          编辑
        </Button>,
      );
    }

    if (canResetPassword) {
      actions.push(
        <RKConfirmAction
          key="reset-password"
          size="small"
          request={async () => ({ code: 200 })}
          confirm={{
            title: "确认重置密码",
            content: `确认将 ${entity.name} 的密码重置为初始密码吗？`,
          }}
          successMessage="密码已重置"
        >
          重置密码
        </RKConfirmAction>,
      );
    }

    if (canDeleteUser && entity.id !== currentUserId) {
      actions.push(
        <RKConfirmAction
          key="delete"
          size="small"
          request={() => deleteUsers([entity.id])}
          confirm={{
            title: "确认删除",
            content: `确认删除用户 ${entity.name} 吗？`,
          }}
          successMessage="删除成功"
          onSuccess={reloadTable}
        >
          删除
        </RKConfirmAction>,
      );
    }

    return actions.length ? actions : "-";
  };

  const columns: ProColumns<DemoUser>[] = [
    {
      title: "用户",
      dataIndex: "name",
      width: 150,
    },
    {
      title: "账号",
      width: 150,
      dataIndex: "account",
    },
    {
      title: "状态",
      dataIndex: "status",
      valueEnum: userStatusValueEnum,
      width: 110,
      render: (_, entity) => (
        <Switch
          checked={entity.status === "在职"}
          disabled={!canUpdateUser || entity.id === currentUserId}
          loading={statusLoadingId === entity.id}
          onChange={() => handleStatusChange(entity)}
        />
      ),
    },
    {
      title: "部门/岗位",
      dataIndex: "department",
      width: 230,
      render: (_, entity) => (
        <Space direction="vertical" size={0}>
          <span>{entity.department}</span>
          <Text type="secondary">{entity.position}</Text>
        </Space>
      ),
    },
    {
      title: "权限角色",
      dataIndex: "role",
      width: 260,
      search: false,
      render: (_, entity) => {
        const roleTags = getRoleTags(entity.id);

        return roleTags.length ? (
          renderLimitedTags(roleTags, 2)
        ) : (
          <Tag>{entity.role}</Tag>
        );
      },
    },
    {
      title: "业务权限",
      dataIndex: "platformPermissions",
      width: 260,
      search: false,
      render: (_, entity) =>
        renderLimitedTags(
          (entity.platformPermissions || []).map((key) => ({
            key,
            label: platformFunctionLabel[key as PlatformFunction],
          })),
          3,
        ),
    },
    {
      title: "数据源范围",
      dataIndex: "allowedSources",
      width: 300,
      search: false,
      render: (_, entity) =>
        entity.allowedSources?.length
          ? renderLimitedTags(
              entity.allowedSources.map((sourceId) => ({
                key: sourceId,
                label: sourceNameMap.get(sourceId) || sourceId,
              })),
              2,
            )
          : "-",
    },
    {
      title: "字段权限",
      dataIndex: "fieldScope",
      width: 300,
      ellipsis: true,
      search: false,
    },
    {
      title: "明文授权",
      dataIndex: "canViewPlain",
      width: 110,
      search: false,
      render: (_, entity) => (
        <Tag color={entity.canViewPlain ? "gold" : "cyan"}>
          {entity.canViewPlain ? "明文" : "脱敏"}
        </Tag>
      ),
    },
    {
      title: "最近登录",
      dataIndex: "lastLoginAt",
      width: 170,
      search: false,
    },
    {
      title: "操作",
      valueType: "option",
      key: "option",
      width: 210,
      align: "center",
      fixed: "right",
      render: (_, entity) => renderUserActions(entity),
    },
  ];

  return (
    <PageContainer header={{ title: false }}>
      <RKTable<
        DemoUser,
        Record<string, unknown>,
        "text",
        RKTableConditionRequestParams
      >
        actionRef={actionRef}
        rowKey="id"
        headerTitle="用户列表"
        columns={columns}
        batchActions={
          canDeleteUser
            ? [
                {
                  key: "delete",
                  label: "批量删除",
                  danger: true,
                  request: ({ selectedRowKeys }) =>
                    deleteUsers(toStringIds(selectedRowKeys)),
                  confirm: ({ selectedRows }) => ({
                    title: "确认删除",
                    content: `确认删除用户 ${selectedRows
                      .map((item) => item.name)
                      .join(",")} 吗？`,
                  }),
                  successMessage: "删除成功",
                  reloadOnSuccess: true,
                  clearSelectedOnSuccess: true,
                },
              ]
            : []
        }
        requestApi={queryUsers}
        requestParamsFormatter={createRKTableConditionRequestParamsFormatter(
          USER_LIST_CONDITIONS,
        )}
        defaultPageSize={10}
        search={{ labelWidth: 80 }}
        scroll={{ x: 2070 }}
        toolBarRender={
          canCreateUser
            ? () => [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openCreateDrawer}
                >
                  新建
                </Button>,
              ]
            : undefined
        }
      />

      <DrawerForm<DemoUserFormValues>
        key={editingUser?.id || "create"}
        title={editingUser ? "编辑用户" : "新建用户"}
        width={680}
        open={drawerOpen}
        drawerProps={{
          destroyOnHidden: true,
          maskClosable: false,
        }}
        grid
        colProps={FORM_COL_FULL}
        initialValues={toFormValues(editingUser)}
        onOpenChange={(visible) => {
          setDrawerOpen(visible);
          if (!visible) setEditingUser(undefined);
        }}
        onFinish={handleSubmit}
        submitter={{
          searchConfig: {
            submitText: "保存",
            resetText: "取消",
          },
        }}
      >
        <ProFormText
          name="account"
          label="登录账号"
          rules={[{ required: true, message: "请输入登录账号" }]}
        />
        <ProFormText
          name="name"
          label="用户姓名"
          rules={[{ required: true, message: "请输入用户姓名" }]}
        />
        <ProFormText
          name="employeeNo"
          label="员工编号"
          rules={[{ required: true, message: "请输入员工编号" }]}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={userStatusOptions}
          rules={[{ required: true, message: "请选择状态" }]}
        />
        <ProFormSelect
          name="department"
          label="所属部门"
          options={departmentOptions}
          fieldProps={{
            optionFilterProp: "label",
            showSearch: true,
          }}
          rules={[{ required: true, message: "请选择所属部门" }]}
        />
        <ProFormSelect
          name="position"
          label="岗位"
          options={positionOptions}
          fieldProps={{
            optionFilterProp: "label",
            showSearch: true,
          }}
          rules={[{ required: true, message: "请选择岗位" }]}
        />
        <ProFormSelect
          name="roleIds"
          label="权限角色"
          mode="multiple"
          options={roleOptions}
          fieldProps={{
            allowClear: false,
            optionFilterProp: "label",
            showSearch: true,
          }}
          rules={[{ required: true, message: "请选择权限角色" }]}
        />
        <ProFormTextArea
          colProps={FORM_COL_FULL}
          name="dataScope"
          label="数据范围说明"
          fieldProps={{
            autoSize: {
              minRows: 2,
              maxRows: 4,
            },
          }}
          rules={[{ required: true, message: "请输入数据范围说明" }]}
        />
        <ProFormTextArea
          colProps={FORM_COL_FULL}
          name="fieldScope"
          label="字段权限说明"
          fieldProps={{
            autoSize: {
              minRows: 2,
              maxRows: 4,
            },
          }}
          rules={[{ required: true, message: "请输入字段权限说明" }]}
        />
      </DrawerForm>
    </PageContainer>
  );
};

export default Users;
