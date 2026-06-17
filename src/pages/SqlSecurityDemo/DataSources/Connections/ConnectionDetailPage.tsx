import type {
  ProColumns,
  ProDescriptionsItemProps,
} from "@ant-design/pro-components";
import {
  PageContainer,
  ProDescriptions,
} from "@ant-design/pro-components";
import { RKTable } from "@rklink/components";
import { useParams } from "@umijs/max";
import { Button, Card, Drawer, Flex, Space, Statistic, Tag } from "antd";
import { useEffect, useMemo, useState } from "react";
import {
  connectionStatusMeta,
  sourceTypeLabel,
  type DatabaseDriverPackage,
  type DemoDataSource,
} from "../../mock";
import {
  getMockDataSourceConnection,
  queryMockDriverPackages,
} from "../../mockApi";
import { tablePagination } from "../../tablePagination";
import { splitHostPort } from "../shared";

const renderBoolean = (value?: boolean) => (value ? "是" : "否");

type SchemaOverviewRow = {
  schema: string;
  tableCount: number;
  authorizedTables: string[];
  sensitiveLevel: DemoDataSource["sensitiveLevel"];
};

type AuthorizedTableRow = {
  key: string;
  schema: string;
  tableName: string;
  scope: string;
  sensitiveLevel: DemoDataSource["sensitiveLevel"];
};

const buildSchemaOverviewRows = (
  source?: DemoDataSource,
): SchemaOverviewRow[] => {
  if (!source?.schemas.length) return [];

  const schemaCount = source.schemaCount || source.schemas.length;
  const baseTableCount = Math.floor(source.tableCount / schemaCount);
  const restTableCount = source.tableCount % schemaCount;

  return source.schemas.map((schema, index) => ({
    schema,
    tableCount: baseTableCount + (index < restTableCount ? 1 : 0),
    authorizedTables: source.authorizedTables.filter(
      (_, tableIndex) => tableIndex % source.schemas.length === index,
    ),
    sensitiveLevel: source.sensitiveLevel,
  }));
};

const renderConnectionStatus = (
  status?: DemoDataSource["connectionStatus"],
) => {
  const meta = status ? connectionStatusMeta[status] : undefined;

  return meta ? <Tag color={meta.color}>{meta.text}</Tag> : "-";
};

const buildAuthorizedTableRows = (
  schemaRow?: SchemaOverviewRow,
): AuthorizedTableRow[] =>
  (schemaRow?.authorizedTables || []).map((tableName) => ({
    key: `${schemaRow?.schema}.${tableName}`,
    schema: schemaRow?.schema || "-",
    tableName,
    scope: "SELECT / DML审批",
    sensitiveLevel: schemaRow?.sensitiveLevel || "中",
  }));

const ConnectionDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState<DemoDataSource>();
  const [driverRows, setDriverRows] = useState<DatabaseDriverPackage[]>([]);
  const [activeSchemaRow, setActiveSchemaRow] = useState<SchemaOverviewRow>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [detailResult, driverResult] = await Promise.all([
          getMockDataSourceConnection(id),
          queryMockDriverPackages(),
        ]);
        setData(detailResult.data);
        setDriverRows(driverResult.data);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id]);

  const driverLabel =
    driverRows.find((driver) => driver.id === data?.driverId)?.name ||
    data?.driverId;
  const node = data ? splitHostPort(data.host) : undefined;
  const schemaRows = useMemo(() => buildSchemaOverviewRows(data), [data]);
  const authorizedTableRows = useMemo(
    () => buildAuthorizedTableRows(activeSchemaRow),
    [activeSchemaRow],
  );
  const schemaColumns = useMemo<ProColumns<SchemaOverviewRow>[]>(
    () => [
      {
        title: "Schema",
        dataIndex: "schema",
        render: (_, record) => <Tag color="blue">{record.schema}</Tag>,
      },
      {
        title: "表数量估算",
        dataIndex: "tableCount",
        width: 120,
      },
      {
        title: "授权表范围",
        dataIndex: "authorizedTables",
        render: (_, record) => (
          <Space size={8}>
            <Tag color={record.authorizedTables.length ? "processing" : "default"}>
              {record.authorizedTables.length
                ? `已授权 ${record.authorizedTables.length} 张`
                : "未配置"}
            </Tag>
            <Button
              disabled={!record.authorizedTables.length}
              size="small"
              type="link"
              onClick={() => setActiveSchemaRow(record)}
            >
              查看明细
            </Button>
          </Space>
        ),
      },
      {
        title: "敏感等级",
        dataIndex: "sensitiveLevel",
        width: 120,
        render: (_, record) => (
          <Tag
            color={
              record.sensitiveLevel === "高"
                ? "red"
                : record.sensitiveLevel === "中"
                ? "gold"
                : "green"
            }
          >
            {record.sensitiveLevel}
          </Tag>
        ),
      },
    ],
    [],
  );
  const authorizedTableColumns = useMemo<ProColumns<AuthorizedTableRow>[]>(
    () => [
      {
        title: "Schema",
        dataIndex: "schema",
        width: 160,
        render: (_, record) => <Tag color="blue">{record.schema}</Tag>,
      },
      {
        title: "表名",
        dataIndex: "tableName",
      },
      {
        title: "授权范围",
        dataIndex: "scope",
        width: 160,
      },
      {
        title: "敏感等级",
        dataIndex: "sensitiveLevel",
        width: 120,
        render: (_, record) => (
          <Tag
            color={
              record.sensitiveLevel === "高"
                ? "red"
                : record.sensitiveLevel === "中"
                ? "gold"
                : "green"
            }
          >
            {record.sensitiveLevel}
          </Tag>
        ),
      },
    ],
    [],
  );

  const columns = useMemo<ProDescriptionsItemProps<DemoDataSource>[]>(
    () => [
      {
        title: "数据库类型",
        dataIndex: "dbType",
        render: (_, entity) => sourceTypeLabel[entity.dbType],
      },
      {
        title: "集群",
        dataIndex: "clusterEnabled",
        render: (_, entity) => renderBoolean(entity.clusterEnabled),
      },
      {
        title: "连接模式",
        dataIndex: "connectionMode",
        render: (_, entity) =>
          entity.connectionMode === "HOST_PORT" ? "主机端口" : "URL",
      },
      {
        title: "名称",
        dataIndex: "name",
      },
      {
        title: "环境类型",
        dataIndex: "environment",
      },
      {
        title: "选择驱动",
        dataIndex: "driverId",
        render: () => driverLabel || "-",
      },
      {
        title: "主机",
        dataIndex: "host",
        render: () => node?.host || "-",
      },
      {
        title: "端口",
        dataIndex: "host",
        render: () => node?.port || "-",
      },
      {
        title: "数据库名",
        dataIndex: "databaseName",
      },
      {
        title: "Schema数",
        dataIndex: "schemaCount",
      },
      {
        title: "表数量",
        dataIndex: "tableCount",
      },
      {
        title: "用户名",
        dataIndex: "username",
      },
      {
        title: "密码",
        dataIndex: "password",
        render: () => "******",
      },
      {
        title: "JDBC 地址",
        dataIndex: "jdbcUrl",
        span: 2,
      },
      {
        title: "状态",
        dataIndex: "connectionStatus",
        render: (_, entity) =>
          renderConnectionStatus(entity?.connectionStatus),
      },
      {
        title: "最近检测",
        dataIndex: "lastTestAt",
      },
    ],
    [driverLabel, node?.host, node?.port],
  );

  return (
    <PageContainer header={{ title: false }}>
      <Flex vertical gap={16}>
        <Card title="Schema概览" variant="borderless" loading={loading}>
          <Flex vertical gap={16}>
            <Space size={48} wrap>
              <Statistic
                title="已展示Schema"
                value={schemaRows.length}
                suffix={`/ ${data?.schemaCount ?? schemaRows.length}`}
              />
              <Statistic title="表总数" value={data?.tableCount ?? 0} />
              <Statistic
                title="授权表总数"
                value={data?.authorizedTables.length ?? 0}
              />
            </Space>
            <RKTable<SchemaOverviewRow>
              columns={schemaColumns}
              dataSource={schemaRows}
              pagination={tablePagination}
              rowKey="schema"
              size="small"
              search={false}
              options={false}
            />
          </Flex>
        </Card>
        <Card variant="borderless">
          <ProDescriptions<DemoDataSource>
            column={4}
            columns={columns}
            dataSource={data}
            emptyText="-"
            layout="vertical"
            loading={loading}
          />
        </Card>
      </Flex>
      <Drawer
        destroyOnClose
        open={!!activeSchemaRow}
        title={`${activeSchemaRow?.schema || ""} 授权表范围`}
        width={720}
        onClose={() => setActiveSchemaRow(undefined)}
      >
        <RKTable<AuthorizedTableRow>
          columns={authorizedTableColumns}
          dataSource={authorizedTableRows}
          pagination={tablePagination}
          rowKey="key"
          size="small"
          search={false}
          options={false}
        />
      </Drawer>
    </PageContainer>
  );
};

export default ConnectionDetailPage;
