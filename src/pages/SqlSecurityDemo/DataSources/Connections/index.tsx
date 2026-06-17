import { PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer } from "@ant-design/pro-components";
import {
  RKConfirmAction,
  RKRequestAction,
  RKTable,
  createRKTableConditionRequestParamsFormatter,
  type RKTableConditionRequestParams,
  type RKTableRequestCondition,
} from "@rklink/components";
import { history } from "@umijs/max";
import { Button, Space, Tag } from "antd";
import type { Key } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  connectionStatusMeta,
  type DatabaseDriverPackage,
  type DemoDataSource,
} from "../../mock";
import {
  deleteMockDataSourceConnection,
  queryMockDataSourceConnections,
  queryMockDriverPackages,
  testMockDataSourceConnection,
} from "../../mockApi";
import { dbTypeValueEnum, filterText, splitHostPort } from "../shared";

const environmentValueEnum = {
  生产: { text: "生产环境" },
  测试: { text: "测试环境" },
  开发: { text: "开发环境" },
};

const connectionStatusValueEnum = {
  online: { text: connectionStatusMeta.online.text, status: "Success" },
  warning: { text: connectionStatusMeta.warning.text, status: "Warning" },
  offline: { text: connectionStatusMeta.offline.text, status: "Error" },
};

const DB_CONNECTION_LIST_CONDITIONS = {
  name: "like",
  dbType: "eq",
  environment: "eq",
  connectionStatus: "eq",
  host: "like",
} as const;

const toStringIds = (keys: Key[] = []) => keys.map(String).filter(Boolean);

const getConditionValue = (
  conditions: RKTableRequestCondition[] = [],
  field: string,
) => conditions.find((item) => item.field === field)?.value;

const renderSchemaTags = (schemas: string[] = []) => {
  const visibleSchemas = schemas.slice(0, 2);
  const restCount = schemas.length - visibleSchemas.length;

  return (
    <Space size={[0, 4]} wrap>
      {visibleSchemas.map((schema) => (
        <Tag key={schema}>{schema}</Tag>
      ))}
      {restCount > 0 && <Tag>+{restCount}</Tag>}
    </Space>
  );
};

const Connections = () => {
  const actionRef = useRef<ActionType>();
  const [driverRows, setDriverRows] = useState<DatabaseDriverPackage[]>([]);

  const driverNameById = useMemo(
    () =>
      new Map(
        driverRows.map((driver) => [
          driver.id,
          `${driver.name} ${driver.version}`,
        ]),
      ),
    [driverRows],
  );

  useEffect(() => {
    queryMockDriverPackages().then((result) => {
      setDriverRows(result.data);
    });
  }, []);

  const reloadTable = () => {
    actionRef.current?.reload();
  };

  const deleteConnections = async (ids: string[]) => {
    await Promise.all(ids.map((id) => deleteMockDataSourceConnection(id)));
    return { code: 200 };
  };

  const queryConnections = async (params: RKTableConditionRequestParams) => {
    const result = await queryMockDataSourceConnections();
    const pageNum = Number(params.pageNum || 1);
    const pageSize = Number(params.pageSize || 10);
    const conditions = params.conditions || [];
    const name = getConditionValue(conditions, "name");
    const host = getConditionValue(conditions, "host");
    const dbType = getConditionValue(conditions, "dbType");
    const environment = getConditionValue(conditions, "environment");
    const connectionStatus = getConditionValue(conditions, "connectionStatus");

    const rows = result.data.filter(
      (row) =>
        filterText(row.name, name) &&
        filterText(row.host, host) &&
        (!dbType || row.dbType === dbType) &&
        (!environment || row.environment === environment) &&
        (!connectionStatus || row.connectionStatus === connectionStatus),
    );
    const start = (pageNum - 1) * pageSize;

    return {
      code: 200,
      data: rows.slice(start, start + pageSize),
      total: rows.length,
    };
  };

  const columns: ProColumns<DemoDataSource>[] = [
    {
      title: "名称",
      dataIndex: "name",
      width: 210,
      render: (dom, entity) => (
        <Button
          size="small"
          type="link"
          onClick={() =>
            history.push(`/database/connections/detail/${entity.id}`)
          }
        >
          {dom}
        </Button>
      ),
    },
    {
      title: "数据库类型",
      dataIndex: "dbType",
      valueEnum: dbTypeValueEnum,
      width: 140,
    },
    {
      title: "环境类型",
      dataIndex: "environment",
      valueEnum: environmentValueEnum,
      width: 120,
    },
    {
      title: "状态",
      dataIndex: "connectionStatus",
      valueEnum: connectionStatusValueEnum,
      width: 120,
    },
    {
      title: "主机地址",
      dataIndex: "host",
      ellipsis: true,
      width: 160,
    },
    {
      title: "端口",
      dataIndex: "host",
      hideInSearch: true,
      width: 90,
      renderText: (value: string) => splitHostPort(value).port,
    },
    {
      title: "Schema数",
      dataIndex: "schemaCount",
      hideInSearch: true,
      width: 100,
    },
    {
      title: "表数量",
      dataIndex: "tableCount",
      hideInSearch: true,
      width: 100,
    },

    {
      title: "操作",
      valueType: "option",
      key: "option",
      align: "center",
      fixed: "right",
      width: 260,
      render: (_, entity) => (
        <>
          <Button
            size="small"
            type="link"
            onClick={() =>
              history.push(`/database/connections/edit/${entity.id}`)
            }
          >
            编辑
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() =>
              history.push(`/database/connections/create?copyId=${entity.id}`)
            }
          >
            复制
          </Button>
          <RKRequestAction
            size="small"
            request={() => testMockDataSourceConnection(entity.id)}
            successMessage="测试成功"
            onSuccess={reloadTable}
          >
            测试连接
          </RKRequestAction>
          <RKConfirmAction
            size="small"
            request={() => deleteConnections([entity.id])}
            confirm={{
              title: "确认删除",
              content: `确认删除数据库连接 ${entity.name} 吗？`,
            }}
            successMessage="删除成功"
            onSuccess={reloadTable}
          >
            删除
          </RKConfirmAction>
        </>
      ),
    },
  ];

  return (
    <PageContainer header={{ title: false }}>
      <RKTable<
        DemoDataSource,
        Record<string, unknown>,
        "text",
        RKTableConditionRequestParams
      >
        actionRef={actionRef}
        rowKey="id"
        headerTitle="连接列表"
        columns={columns}
        batchActions={[
          {
            key: "delete",
            label: "批量删除",
            danger: true,
            request: ({ selectedRowKeys }) =>
              deleteConnections(toStringIds(selectedRowKeys)),
            confirm: ({ selectedRows }) => ({
              title: "确认删除",
              content: `确认删除数据库连接 ${selectedRows
                .map((item) => item.name)
                .join(",")} 吗？`,
            }),
            successMessage: "删除成功",
            reloadOnSuccess: true,
            clearSelectedOnSuccess: true,
          },
        ]}
        requestApi={queryConnections}
        requestParamsFormatter={createRKTableConditionRequestParamsFormatter(
          DB_CONNECTION_LIST_CONDITIONS,
        )}
        defaultPageSize={10}
        search={{ labelWidth: 90 }}
        scroll={{ x: 1860 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push("/database/connections/create")}
          >
            新建
          </Button>,
        ]}
      />
    </PageContainer>
  );
};

export default Connections;
