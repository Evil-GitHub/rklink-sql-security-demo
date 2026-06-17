import { UploadOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import {
  RKConfirmAction,
  RKTable,
  createRKTableConditionRequestParamsFormatter,
  type RKTableConditionRequestParams,
  type RKTableRequestCondition,
} from "@rklink/components";
import { useRequest } from "@umijs/max";
import type { TreeProps } from "antd";
import { Button, Card, Col, Row, Tag, Tree } from "antd";
import type { FC } from "react";
import { useMemo, useRef, useState } from "react";
import type { DatabaseDriverPackage } from "../../mock";
import {
  deleteMockDriverPackage,
  downloadMockDriverPackage,
  queryMockDriverPackages,
} from "../../mockApi";
import { ALL_DB_TYPE_KEY, dbKindOptions, filterText } from "../shared";
import DriverDetailDrawer from "./components/DriverDetailDrawer";
import DriverUploadDrawer from "./components/DriverUploadDrawer";

const JDBC_DRIVER_LIST_CONDITIONS = {
  selectedDbType: {
    field: "dbType",
    operator: "eq",
  },
  name: "like",
  driverIdentifier: "like",
  driverClassName: "like",
} as const;

const getDriverDownloadFileName = (record: DatabaseDriverPackage) =>
  record.originalFileName ||
  `${record.name || record.driverIdentifier || `jdbc-driver-${record.id}`}.jar`;

const canManageDriver = (record: DatabaseDriverPackage) => !record.builtIn;

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const getConditionValue = (
  conditions: RKTableRequestCondition[] = [],
  field: string,
) => conditions.find((item) => item.field === field)?.value;

const getDriverDownloadBlob = async (record: DatabaseDriverPackage) => {
  await downloadMockDriverPackage(record.id);

  return new Blob(
    [
      [
        `Mock JDBC Driver: ${record.name}`,
        `Identifier: ${record.driverIdentifier}`,
        `ClassName: ${record.driverClassName}`,
        `Database: ${record.dbType}`,
      ].join("\n"),
    ],
    {
      type: "application/java-archive",
    },
  );
};

const Drivers: FC = () => {
  const actionRef = useRef<any>();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DatabaseDriverPackage>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailDriver, setDetailDriver] = useState<DatabaseDriverPackage>();
  const [selectedDbTypeKey, setSelectedDbTypeKey] = useState(ALL_DB_TYPE_KEY);

  const { run: downloadDriver, fetches } = useRequest(
    async (record: DatabaseDriverPackage) => {
      const blob = await getDriverDownloadBlob(record);

      downloadBlob(blob, getDriverDownloadFileName(record));
    },
    {
      manual: true,
      fetchKey: (record) => String(record.id),
      onSuccess: () => {
        actionRef.current?.reload();
      },
    },
  );

  const dbTypeTreeData = useMemo<TreeProps["treeData"]>(
    () => [
      {
        title: "全部",
        key: ALL_DB_TYPE_KEY,
        children: dbKindOptions.map((item) => ({
          title: item.label,
          key: String(item.value),
        })),
      },
    ],
    [],
  );

  const dbTypeMap = useMemo(() => {
    const nextMap = new Map<string, string>();

    dbKindOptions.forEach((item) => {
      if (item.value) {
        nextMap.set(String(item.value), String(item.label || item.value));
      }
    });

    return nextMap;
  }, []);

  const selectedDbType =
    selectedDbTypeKey === ALL_DB_TYPE_KEY ? undefined : selectedDbTypeKey;

  const reloadTable = () => {
    actionRef.current?.reload();
  };

  const resetFormState = () => {
    setEditingDriver(undefined);
  };

  const handleCreate = () => {
    resetFormState();
    setUploadOpen(true);
  };

  const handleEdit = (record: DatabaseDriverPackage) => {
    setEditingDriver(record);
    setUploadOpen(true);
  };

  const handleView = (record: DatabaseDriverPackage) => {
    setDetailDriver(record);
    setDetailOpen(true);
  };

  const handleDbTypeSelect: TreeProps["onSelect"] = (selectedKeys) => {
    const nextKey = String(selectedKeys[0] || ALL_DB_TYPE_KEY);
    setSelectedDbTypeKey(nextKey);
  };

  const queryDrivers = async (params: RKTableConditionRequestParams) => {
    const result = await queryMockDriverPackages();
    const pageNum = Number(params.pageNum || 1);
    const pageSize = Number(params.pageSize || 10);
    const conditions = params.conditions || [];
    const dbType = getConditionValue(conditions, "dbType");
    const name = getConditionValue(conditions, "name");
    const driverIdentifier = getConditionValue(conditions, "driverIdentifier");
    const driverClassName = getConditionValue(conditions, "driverClassName");

    const rows = result.data.filter(
      (row) =>
        (!dbType || row.dbType === dbType) &&
        filterText(row.name, name) &&
        filterText(row.driverIdentifier, driverIdentifier) &&
        filterText(row.driverClassName, driverClassName),
    );
    const start = (pageNum - 1) * pageSize;

    return {
      code: 200,
      data: rows.slice(start, start + pageSize),
      total: rows.length,
    };
  };

  return (
    <PageContainer header={{ title: false }}>
      <RKTable<
        DatabaseDriverPackage,
        Record<string, unknown>,
        "text",
        RKTableConditionRequestParams
      >
        cardProps={{
          style: {
            height: "100%",
          },
        }}
        headerTitle="驱动列表"
        tableRender={(_, dom) => (
          <Row wrap={false} gutter={16}>
            <Col flex="300px">
              <Card
                variant="borderless"
                title="数据库类型"
                style={{
                  height: "100%",
                }}
              >
                <Tree
                  blockNode
                  expandedKeys={[ALL_DB_TYPE_KEY]}
                  selectedKeys={[selectedDbTypeKey]}
                  treeData={dbTypeTreeData}
                  onSelect={handleDbTypeSelect}
                />
              </Card>
            </Col>
            <Col flex="auto">{dom}</Col>
          </Row>
        )}
        actionRef={actionRef}
        rowKey="id"
        params={{ selectedDbType }}
        requestApi={queryDrivers}
        defaultPageSize={10}
        requestParamsFormatter={createRKTableConditionRequestParamsFormatter(
          JDBC_DRIVER_LIST_CONDITIONS,
        )}
        columns={[
          {
            title: "驱动名称",
            dataIndex: "name",
            width: 180,
            render: (dom, entity) => (
              <a onClick={() => handleView(entity)}>{dom}</a>
            ),
          },
          {
            title: "标签",
            dataIndex: "driverIdentifier",
            ellipsis: true,
            width: 180,
            render(dom) {
              return <Tag color="cyan">{dom}</Tag>;
            },
          },
          {
            title: "是否默认",
            dataIndex: "defaultDriver",
            width: 110,
            hideInSearch: true,
            render: (_, entity) => (entity.defaultDriver ? "是" : "-"),
          },
          {
            title: "操作",
            valueType: "option",
            key: "option",
            align: "center",
            width: 180,
            fixed: "right",
            render: (_, entity) =>
              entity.id ? (
                <>
                  {canManageDriver(entity) && (
                    <Button
                      size="small"
                      type="link"
                      onClick={() => handleEdit(entity)}
                    >
                      编辑
                    </Button>
                  )}
                  {!entity.builtIn && (
                    <Button
                      size="small"
                      type="link"
                      loading={fetches[String(entity.id)]?.loading}
                      onClick={() => downloadDriver(entity)}
                    >
                      下载
                    </Button>
                  )}
                  {canManageDriver(entity) && (
                    <RKConfirmAction
                      size="small"
                      request={() => deleteMockDriverPackage(entity.id)}
                      confirm={{
                        title: "确认删除",
                        content: `确认删除驱动 ${entity.name} 吗？`,
                      }}
                      successMessage="删除成功"
                      onSuccess={reloadTable}
                    >
                      删除
                    </RKConfirmAction>
                  )}
                </>
              ) : null,
          },
        ]}
        toolBarRender={() => [
          <Button
            key="upload"
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleCreate}
          >
            新建驱动
          </Button>,
        ]}
      />

      <DriverUploadDrawer
        open={uploadOpen}
        driver={editingDriver}
        dbTypeOptions={dbKindOptions}
        onOpenChange={(open) => {
          setUploadOpen(open);

          if (!open) {
            resetFormState();
          }
        }}
        onSuccess={reloadTable}
      />

      <DriverDetailDrawer
        open={detailOpen}
        driver={detailDriver}
        dbTypeMap={dbTypeMap}
        onClose={() => {
          setDetailOpen(false);
          setDetailDriver(undefined);
        }}
      />
    </PageContainer>
  );
};

export default Drivers;
