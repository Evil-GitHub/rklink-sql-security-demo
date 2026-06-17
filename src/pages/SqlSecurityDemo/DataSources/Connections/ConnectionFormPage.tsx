import { ReloadOutlined } from "@ant-design/icons";
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormDependency,
  ProFormDigit,
  ProFormInstance,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormItem,
} from "@ant-design/pro-components";
import { history, useLocation, useParams } from "@umijs/max";
import { Button, Card, Col, Space, Spin, Tree, message } from "antd";
import type { Key } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DatabaseDriverPackage,
  DbKind,
  DemoDataSource,
} from "../../mock";
import {
  createMockDataSourceConnection,
  getMockDataSourceConnection,
  queryMockAuthorizedTableTree,
  queryMockDriverPackages,
  updateMockDataSourceConnection,
  type AuthorizedTableTreeNode,
  type DataSourceConnectionPayload,
} from "../../mockApi";
import {
  FORM_COL_4,
  FORM_COL_FULL,
  FORM_ROW_GUTTER,
  dbKindOptions,
  splitHostPort,
} from "../shared";

const environmentOptions: DemoDataSource["environment"][] = [
  "生产",
  "测试",
  "开发",
];
const sensitiveLevelOptions: DemoDataSource["sensitiveLevel"][] = [
  "低",
  "中",
  "高",
];
type ConnectionFormValues = Partial<
  Omit<DataSourceConnectionPayload, "authorizedTables"> & {
    authorizedTables?: string[];
  }
>;

const getConnectionId = (id?: string) => id || undefined;

const toFormValues = (detail?: DemoDataSource): ConnectionFormValues => {
  if (!detail) {
    return {
      dbType: "mysql",
      connectionMode: "HOST_PORT",
      environment: "测试",
      port: 3306,
      sensitiveLevel: "中",
      automaticScanning: true,
    };
  }

  const { host, port } = splitHostPort(detail.host);

  return {
    name: detail.name,
    dbType: detail.dbType,
    connectionMode: detail.connectionMode,
    environment: detail.environment,
    host,
    port,
    databaseName: detail.databaseName,
    schemaName: detail.schemas[0],
    owner: detail.owner,
    username: detail.username,
    password: "mock-password",
    driverId: detail.driverId,
    sensitiveLevel: detail.sensitiveLevel,
    authorizedTables: detail.authorizedTables,
    automaticScanning: detail.automaticScanning,
  };
};

type AuthorizedTablesTreeFieldProps = {
  dbType?: DbKind;
  disabled?: boolean;
  onChange?: (value: string[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  onTableKeysChange?: (value: string[]) => void;
  refreshKey?: number;
  schemaName?: string;
  value?: string[];
};

const schemaKeyPrefix = "schema:";

const normalizeCheckedKeys = (
  checkedKeys: Key[] | { checked: Key[]; halfChecked: Key[] },
) => {
  const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;

  return keys.map(String).filter((key) => !key.startsWith(schemaKeyPrefix));
};

const getTableKeys = (treeData: AuthorizedTableTreeNode[]) =>
  treeData.flatMap((node) =>
    (node.children || []).map((child) => child.key),
  );

const AuthorizedTablesTreeField = ({
  dbType,
  disabled,
  onChange,
  onLoadingChange,
  onTableKeysChange,
  refreshKey = 0,
  schemaName,
  value,
}: AuthorizedTablesTreeFieldProps) => {
  const [treeData, setTreeData] = useState<AuthorizedTableTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const scopeKey = `${dbType || "mysql"}:${schemaName || ""}`;
  const lastScopeKeyRef = useRef<string>();
  const checkedValue = value || [];
  const selectedValueKey = checkedValue.join("|");
  const expandedKeys = useMemo(
    () => treeData.map((node) => node.key),
    [treeData],
  );

  useEffect(() => {
    let mounted = true;
    const scopeChanged =
      lastScopeKeyRef.current !== undefined &&
      lastScopeKeyRef.current !== scopeKey;
    const wasAllSelected =
      treeData.length > 0 &&
      checkedValue.length > 0 &&
      getTableKeys(treeData).every((key) => checkedValue.includes(key));
    setLoading(true);
    onLoadingChange?.(true);
    queryMockAuthorizedTableTree({
      dbType,
      refreshSeed: refreshKey,
      schemaName,
      selectedTables: checkedValue,
    })
      .then((result) => {
        if (mounted) {
          setTreeData(result.data);
          const nextTableKeys = getTableKeys(result.data);
          onTableKeysChange?.(nextTableKeys);
          if (
            (value === undefined || scopeChanged || wasAllSelected) &&
            nextTableKeys.length
          ) {
            onChange?.(nextTableKeys);
          }
          lastScopeKeyRef.current = scopeKey;
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          onLoadingChange?.(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [dbType, schemaName, scopeKey, selectedValueKey, refreshKey]);

  return (
    <Spin spinning={loading}>
      <Card size="small">
        <Tree
          blockNode
          checkable
          checkedKeys={checkedValue}
          disabled={disabled}
          expandedKeys={expandedKeys}
          selectable={false}
          treeData={treeData}
          onCheck={(checkedKeys) => {
            onChange?.(normalizeCheckedKeys(checkedKeys));
          }}
        />
      </Card>
    </Spin>
  );
};

const ConnectionFormPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const connectionId = getConnectionId(id);
  const copyConnectionId =
    new URLSearchParams(location.search).get("copyId") || undefined;
  const isEdit = !!connectionId;
  const formRef = useRef<ProFormInstance<ConnectionFormValues>>();
  const [saveLoading, setSaveLoading] = useState(false);
  const [driverRows, setDriverRows] = useState<DatabaseDriverPackage[]>([]);
  const [authorizedTableLoading, setAuthorizedTableLoading] = useState(false);
  const [authorizedTableRefreshKey, setAuthorizedTableRefreshKey] = useState(0);
  const [authorizedTableKeys, setAuthorizedTableKeys] = useState<string[]>([]);

  const loadInitialValues = async () => {
    const driverResult = await queryMockDriverPackages();
    setDriverRows(driverResult.data);

    const sourceId = isEdit ? connectionId : copyConnectionId;
    if (!sourceId) {
      return toFormValues();
    }

    const result = await getMockDataSourceConnection(sourceId);
    return toFormValues(result.data);
  };

  const handleFinish = async (values: ConnectionFormValues) => {
    const payload = {
      ...values,
      authorizedTables: values.authorizedTables?.join(", "),
    } as DataSourceConnectionPayload;
    setSaveLoading(true);
    try {
      if (isEdit && connectionId) {
        await updateMockDataSourceConnection(connectionId, payload);
      } else {
        await createMockDataSourceConnection(payload);
      }

      message.success("保存成功");
      history.push("/database/connections");
      return true;
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <PageContainer header={{ title: false }}>
      <Card variant="borderless">
        <ProForm<ConnectionFormValues>
          formRef={formRef}
          grid
          colProps={FORM_COL_4}
          rowProps={FORM_ROW_GUTTER}
          request={loadInitialValues}
          disabled={saveLoading}
          onFinish={handleFinish}
          submitter={{
            searchConfig: {
              submitText: "保存",
              resetText: "取消",
            },
            onReset: () => history.push("/database/connections"),
            render: (_, doms) => <FooterToolbar>{doms}</FooterToolbar>,
            submitButtonProps: {
              loading: saveLoading,
            },
          }}
        >
          <ProFormSelect
            name="dbType"
            label="数据库类型"
            options={dbKindOptions}
            fieldProps={{
              showSearch: true,
              optionFilterProp: "label",
              allowClear: false,
            }}
            rules={[{ required: true, message: "请选择数据库类型" }]}
          />
          <ProFormSwitch name="clusterEnabled" label="集群" disabled />
          <ProFormSelect
            name="connectionMode"
            label="连接模式"
            options={[{ label: "主机端口", value: "HOST_PORT" }]}
            rules={[{ required: true, message: "请选择连接模式" }]}
          />
          <ProFormText
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          />
          <ProFormSelect
            name="environment"
            label="环境类型"
            options={environmentOptions.map((value) => ({
              value,
              label: value,
            }))}
            rules={[{ required: true, message: "请选择环境类型" }]}
          />
          <ProFormDependency name={["dbType"]}>
            {({ dbType }) => (
              <ProFormSelect
                name="driverId"
                label="选择驱动"
                options={driverRows
                  .filter((driver) => !dbType || driver.dbType === dbType)
                  .map((driver) => ({
                    value: driver.id,
                    label: driver.builtIn
                      ? `${driver.name}（内置）`
                      : driver.name,
                  }))}
                rules={[{ required: true, message: "请选择驱动" }]}
                placeholder={dbType ? "请选择驱动" : "请先选择数据库类型"}
              />
            )}
          </ProFormDependency>
          <ProFormText
            name="host"
            label="主机"
            rules={[{ required: true, message: "请输入主机" }]}
          />
          <ProFormDigit
            name="port"
            label="端口"
            min={1}
            max={65535}
            rules={[{ required: true, message: "请输入端口" }]}
          />
          <ProFormText
            name="databaseName"
            label="数据库名"
            rules={[{ required: true, message: "请输入数据库名" }]}
          />
          <ProFormText
            name="schemaName"
            label="Schema"
            rules={[{ required: true, message: "请输入 Schema" }]}
          />
          <ProFormText
            name="owner"
            label="责任部门"
            rules={[{ required: true, message: "请输入责任部门" }]}
          />
          <ProFormSelect
            name="sensitiveLevel"
            label="敏感等级"
            options={sensitiveLevelOptions.map((value) => ({
              value,
              label: value,
            }))}
            rules={[{ required: true, message: "请选择敏感等级" }]}
          />
          <ProFormText
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          />
          <ProFormText.Password
            name="password"
            label="密码"
            rules={[{ required: true, message: "请输入密码" }]}
          />
          <ProFormDependency name={["dbType", "schemaName"]}>
            {({ dbType, schemaName }) => (
              <Col {...FORM_COL_FULL}>
                <ProFormItem
                  name="authorizedTables"
                  label={
                    <Space size={8}>
                      <span>授权表范围</span>
                      <Button
                        disabled={saveLoading || !authorizedTableKeys.length}
                        size="small"
                        type="link"
                        onClick={() =>
                          formRef.current?.setFieldsValue({
                            authorizedTables: authorizedTableKeys,
                          })
                        }
                      >
                        全选
                      </Button>
                      <Button
                        disabled={saveLoading}
                        size="small"
                        type="link"
                        onClick={() =>
                          formRef.current?.setFieldsValue({
                            authorizedTables: [],
                          })
                        }
                      >
                        清空
                      </Button>
                      <Button
                        disabled={saveLoading}
                        icon={<ReloadOutlined />}
                        loading={authorizedTableLoading}
                        size="small"
                        type="link"
                        onClick={() =>
                          setAuthorizedTableRefreshKey((key) => key + 1)
                        }
                      >
                        刷新
                      </Button>
                    </Space>
                  }
                >
                  <AuthorizedTablesTreeField
                    dbType={dbType}
                    disabled={saveLoading}
                    onLoadingChange={setAuthorizedTableLoading}
                    onTableKeysChange={setAuthorizedTableKeys}
                    refreshKey={authorizedTableRefreshKey}
                    schemaName={schemaName}
                  />
                </ProFormItem>
              </Col>
            )}
          </ProFormDependency>
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default ConnectionFormPage;
