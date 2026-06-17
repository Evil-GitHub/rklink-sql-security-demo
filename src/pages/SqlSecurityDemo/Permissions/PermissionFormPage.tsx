import { FORM_COL_4, FORM_COL_FULL, FORM_ROW_GUTTER } from "@/utils/formLayout";
import { PlusOutlined } from "@ant-design/icons";
import type { ProColumns, ProFormInstance } from "@ant-design/pro-components";
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProForm,
  ProFormCheckbox,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { RKTable } from "@rklink/components";
import { history, useParams } from "@umijs/max";
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Space,
  Tabs,
  Tag,
  Tree,
} from "antd";
import type { DataNode } from "antd/es/tree";
import type { Key } from "react";
import { useMemo, useRef, useState } from "react";
import {
  dataSources,
  sourceTypeLabel,
  type DemoUser,
  type SqlType,
} from "../mock";
import {
  createPermissionRole,
  getPermissionRole,
  updatePermissionRole,
  type PermissionRole,
  type PermissionRolePayload,
  type PermissionRoleStatus,
} from "../permissionRoleStore";
import {
  getPermissionCodesByPlatformPermissions,
  getPlatformPermissionsByPermissionCodes,
} from "../routePermissions";
import { readDemoUserAccounts } from "../userStore";
import {
  PERMISSIONS,
  PERMISSION_CODES,
  PERMISSION_CODE_SET,
} from "./menuPermissions";

type PermissionRoleFormValues = Partial<PermissionRolePayload>;

type UserTableFormProps = {
  onChange?: (value: string[]) => void;
  readonly?: boolean;
  value?: string[];
};

type RoleTreeFieldProps = {
  onChange?: (value: string[]) => void;
  readonly?: boolean;
  value?: string[];
};

const ROLE_ROUTE_PREFIX = "/data-security/permissions";

const sqlOperations: SqlType[] = ["select", "insert", "update", "delete"];

const approvalModeOptions = [
  "普通审批；高风险自动升级",
  "生产 DML 严格审批",
  "高危语句审批或阻断",
  "薪酬字段变更需主管审批",
  "核心账务变更需双人复核",
  "不可提交 DML",
].map((value) => ({ label: value, value }));

const executionWindowOptions = [
  "工作日 09:00-18:00",
  "变更窗口 20:00-23:00",
  "受控维护窗口",
  "全天候审计查询",
].map((value) => ({ label: value, value }));

const roleStatusOptions: { label: string; value: PermissionRoleStatus }[] = [
  { label: "启用", value: "enabled" },
  { label: "停用", value: "disabled" },
];

const getAllNodeKeys = (nodes: DataNode[]): Key[] =>
  nodes.reduce<Key[]>((keys, node) => {
    keys.push(node.key);
    if (node.children) keys.push(...getAllNodeKeys(node.children));
    return keys;
  }, []);

const normalizePermissionKeys = (
  checkedKeys: Key[] | { checked: Key[]; halfChecked: Key[] },
) => {
  const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
  return Array.from(
    new Set(keys.map(String).filter((key) => PERMISSION_CODE_SET.has(key))),
  );
};

const defaultRoleValues = (): PermissionRoleFormValues => ({
  name: "",
  description: "",
  status: "enabled",
  userIds: [],
  permissionCodes: getPermissionCodesByPlatformPermissions([
    "overview",
    "console",
    "sqlTemplates",
  ]),
  allowedSources: [dataSources[0].id],
  operations: ["select"],
  canViewPlain: false,
  maskingDefault: true,
  sensitiveAuditEnabled: true,
  exportApprovalRequired: true,
  dmlApprovalMode: approvalModeOptions[0].value,
  resultLimit: 200,
  executionWindow: executionWindowOptions[0].value,
});

const toFormValues = (role?: PermissionRole): PermissionRoleFormValues => {
  if (!role) return defaultRoleValues();

  return {
    ...role,
    userIds: [...role.userIds],
    permissionCodes: [
      ...(role.permissionCodes ||
        getPermissionCodesByPlatformPermissions(
          role.platformPermissions || [],
        )),
    ],
    allowedSources: [...(role.allowedSources || [])],
    operations: [...(role.operations || [])],
  };
};

const toPayload = (values: PermissionRoleFormValues): PermissionRolePayload => {
  const canViewPlain = !!values.canViewPlain;

  return {
    name: String(values.name || "").trim(),
    description: String(values.description || "").trim(),
    status: values.status || "enabled",
    userIds: values.userIds || [],
    permissionCodes: values.permissionCodes || [],
    platformPermissions: getPlatformPermissionsByPermissionCodes(
      values.permissionCodes || [],
    ),
    allowedSources: values.allowedSources || [],
    operations: values.operations || [],
    canViewPlain,
    maskingDefault: canViewPlain ? !!values.maskingDefault : true,
    sensitiveAuditEnabled: !!values.sensitiveAuditEnabled,
    exportApprovalRequired: !!values.exportApprovalRequired,
    dmlApprovalMode: values.dmlApprovalMode || approvalModeOptions[0].value,
    resultLimit: Number(values.resultLimit || 200),
    executionWindow: values.executionWindow || executionWindowOptions[0].value,
  };
};

const UserTableForm = ({
  value = [],
  onChange,
  readonly,
}: UserTableFormProps) => {
  const [open, setOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const users = useMemo(() => readDemoUserAccounts(), []);
  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );
  const userIds = useMemo(
    () =>
      Array.from(new Set(value.map(String).filter((id) => userMap.has(id)))),
    [userMap, value],
  );
  const selectedUserIds = useMemo(() => new Set(userIds), [userIds]);
  const selectedUsers = useMemo(
    () => userIds.map((id) => userMap.get(id)).filter(Boolean) as DemoUser[],
    [userIds, userMap],
  );

  const userColumns = useMemo<ProColumns<DemoUser>[]>(
    () => [
      {
        title: "用户",
        dataIndex: "name",
        width: 220,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <span>{record.name}</span>
            <span>{record.account}</span>
            <Space size={4} wrap>
              <Tag>{record.role}</Tag>
              <Tag color={record.status === "在职" ? "green" : "default"}>
                {record.status}
              </Tag>
            </Space>
          </Space>
        ),
      },
      {
        title: "部门/岗位",
        dataIndex: "department",
        width: 220,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <span>{record.department}</span>
            <span>{record.position}</span>
          </Space>
        ),
      },
      {
        title: "数据范围",
        dataIndex: "dataScope",
        ellipsis: true,
      },
      {
        title: "字段权限",
        dataIndex: "fieldScope",
        ellipsis: true,
      },
    ],
    [],
  );

  const selectedTableColumns = useMemo<ProColumns<DemoUser>[]>(() => {
    if (readonly) return userColumns;

    return [
      ...userColumns,
      {
        title: "操作",
        valueType: "option",
        key: "option",
        width: 90,
        align: "center",
        render: (_, record) => (
          <Button
            key="remove"
            size="small"
            type="link"
            onClick={() => {
              onChange?.(userIds.filter((id) => id !== record.id));
            }}
          >
            移除
          </Button>
        ),
      },
    ];
  }, [onChange, readonly, userColumns, userIds]);

  const handleOpenChange = (visible: boolean) => {
    setOpen(visible);
    if (visible) {
      setSelectedRowKeys([]);
    }
  };

  return (
    <>
      <RKTable<DemoUser>
        rowKey="id"
        search={false}
        options={false}
        dataSource={selectedUsers}
        columns={selectedTableColumns}
        defaultPageSize={5}
        cardProps={{
          bodyStyle: {
            padding: 0,
          },
        }}
        toolBarRender={
          readonly
            ? false
            : () => [
                <Button
                  key="add"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenChange(true)}
                >
                  添加成员
                </Button>,
              ]
        }
      />

      {!readonly && (
        <ModalForm
          title="添加成员"
          width={960}
          open={open}
          onOpenChange={handleOpenChange}
          modalProps={{
            destroyOnHidden: true,
            maskClosable: false,
          }}
          submitter={{
            searchConfig: {
              submitText: "确定",
              resetText: "取消",
            },
          }}
          onFinish={async () => {
            onChange?.(
              Array.from(new Set([...userIds, ...selectedRowKeys.map(String)])),
            );
            setOpen(false);
            return true;
          }}
        >
          <RKTable<DemoUser>
            rowKey="id"
            headerTitle="用户列表"
            search={false}
            options={false}
            dataSource={users}
            columns={userColumns}
            defaultPageSize={10}
            rowSelection={{
              preserveSelectedRowKeys: true,
              selectedRowKeys,
              onChange: (keys) => {
                setSelectedRowKeys(keys);
              },
              getCheckboxProps: (record) => ({
                disabled: selectedUserIds.has(record.id),
              }),
            }}
          />
        </ModalForm>
      )}
    </>
  );
};

const RoleTreeField = ({
  value = [],
  onChange,
  readonly,
}: RoleTreeFieldProps) => {
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const allNodeKeys = useMemo(() => getAllNodeKeys(PERMISSIONS), []);

  return (
    <Space direction="vertical" size="middle">
      <Space wrap>
        <Button
          disabled={readonly}
          onClick={() => onChange?.(PERMISSION_CODES)}
          type="primary"
        >
          全选
        </Button>
        <Button disabled={readonly} onClick={() => onChange?.([])}>
          清空
        </Button>
        <Button type="link" onClick={() => setExpandedKeys(allNodeKeys)}>
          全部展开
        </Button>
        <Button type="link" onClick={() => setExpandedKeys([])}>
          全部收起
        </Button>
      </Space>
      <Tree
        blockNode
        checkable
        selectable={false}
        disabled={readonly}
        checkedKeys={value}
        expandedKeys={expandedKeys}
        treeData={PERMISSIONS}
        onCheck={(checkedKeys) => {
          onChange?.(normalizePermissionKeys(checkedKeys));
        }}
        onExpand={(keys) => setExpandedKeys(keys)}
      />
    </Space>
  );
};

const PermissionFormPage = () => {
  const { message } = App.useApp();
  const { id = "", detailsId = "" } = useParams<{
    detailsId?: string;
    id?: string;
  }>();
  const formRef = useRef<ProFormInstance<PermissionRoleFormValues>>();
  const isEditPage = !!id;
  const isDetailsPage = !!detailsId;
  const roleId = id || detailsId;
  const currentRole = getPermissionRole(roleId);
  const [saveLoading, setSaveLoading] = useState(false);

  const sourceOptions = useMemo(
    () =>
      dataSources.map((source) => ({
        label: `${source.name} / ${sourceTypeLabel[source.dbType]}`,
        value: source.id,
      })),
    [],
  );
  const sqlOperationOptions = useMemo(
    () =>
      sqlOperations.map((operation) => ({
        label: operation.toUpperCase(),
        value: operation,
      })),
    [],
  );

  const loadInitialValues = async () => toFormValues(currentRole);

  const handleFinish = async (values: PermissionRoleFormValues) => {
    const payload = toPayload(values);

    if (!payload.name) {
      message.warning("请输入角色名称");
      return false;
    }
    if (!payload.permissionCodes.length) {
      message.warning("请至少选择一个业务权限");
      return false;
    }
    if (!payload.allowedSources.length) {
      message.warning("请至少选择一个数据源范围");
      return false;
    }
    if (!payload.operations.length) {
      message.warning("请至少选择一个 SQL 操作");
      return false;
    }

    setSaveLoading(true);
    try {
      if (isEditPage && roleId) {
        updatePermissionRole(roleId, payload);
      } else {
        createPermissionRole(payload);
      }
      message.success("保存成功");
      history.push(ROLE_ROUTE_PREFIX);
      return true;
    } finally {
      setSaveLoading(false);
    }
  };

  const items = [
    {
      key: "users",
      label: "成员管理",
      children: (
        <ProForm.Item name="userIds" colProps={FORM_COL_FULL}>
          <UserTableForm readonly={isDetailsPage} />
        </ProForm.Item>
      ),
    },
    {
      key: "permissions",
      label: "权限配置",
      children: (
        <ProForm.Item name="permissionCodes" colProps={FORM_COL_FULL}>
          <RoleTreeField readonly={isDetailsPage} />
        </ProForm.Item>
      ),
    },
    {
      key: "security",
      label: "安全配置",
      children: (
        <ProForm.Group grid colProps={FORM_COL_FULL} rowProps={FORM_ROW_GUTTER}>
          <ProFormSelect
            colProps={{ span: 12 }}
            name="allowedSources"
            label="数据源范围"
            mode="multiple"
            options={sourceOptions}
            fieldProps={{
              allowClear: false,
              optionFilterProp: "label",
              showSearch: true,
            }}
            rules={[{ required: true, message: "请选择数据源范围" }]}
          />
          <ProFormCheckbox.Group
            colProps={{ span: 12 }}
            name="operations"
            label="SQL 操作"
            options={sqlOperationOptions}
            rules={[{ required: true, message: "请选择 SQL 操作" }]}
          />
          <ProFormSelect
            name="dmlApprovalMode"
            label="DML 审批策略"
            options={approvalModeOptions}
            fieldProps={{ allowClear: false }}
            rules={[{ required: true, message: "请选择 DML 审批策略" }]}
          />
          <ProFormDigit
            name="resultLimit"
            label="单次结果行数"
            min={50}
            max={5000}
            step={50}
            rules={[{ required: true, message: "请输入单次结果行数" }]}
          />
          <ProFormSelect
            name="executionWindow"
            label="执行窗口"
            options={executionWindowOptions}
            fieldProps={{ allowClear: false }}
            rules={[{ required: true, message: "请选择执行窗口" }]}
          />
          <ProFormSwitch name="canViewPlain" label="明文授权" />
          <ProFormSwitch name="maskingDefault" label="动态脱敏" />
          <ProFormSwitch name="sensitiveAuditEnabled" label="敏感审计" />
          <ProFormSwitch name="exportApprovalRequired" label="导出审批" />
        </ProForm.Group>
      ),
    },
  ];

  return (
    <PageContainer header={{ title: false }}>
      <Card variant="borderless">
        {isDetailsPage && (
          <Descriptions
            layout="vertical"
            items={[
              {
                key: "name",
                label: "角色",
                children: currentRole?.name || "-",
              },
              {
                key: "description",
                label: "描述",
                children: currentRole?.description || "-",
              },
            ]}
          />
        )}
        <ProForm<PermissionRoleFormValues>
          formRef={formRef}
          grid
          colProps={FORM_COL_4}
          rowProps={FORM_ROW_GUTTER}
          request={loadInitialValues}
          disabled={saveLoading || isDetailsPage}
          onFinish={handleFinish}
          submitter={
            !isDetailsPage && {
              searchConfig: {
                submitText: "保存",
                resetText: "取消",
              },
              onReset: () => history.push(ROLE_ROUTE_PREFIX),
              render: (_, doms) => <FooterToolbar>{doms}</FooterToolbar>,
              submitButtonProps: {
                loading: saveLoading,
              },
            }
          }
        >
          {!isDetailsPage && (
            <>
              <ProFormText
                name="name"
                label="角色"
                rules={[{ required: true, message: "请输入角色名称" }]}
              />
              <ProFormTextArea
                colProps={{ span: 12 }}
                name="description"
                label="描述"
                fieldProps={{
                  autoSize: {
                    minRows: 1,
                    maxRows: 3,
                  },
                }}
              />
            </>
          )}
          <Col {...FORM_COL_FULL}>
            <Tabs defaultActiveKey="users" items={items} />
          </Col>
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default PermissionFormPage;
