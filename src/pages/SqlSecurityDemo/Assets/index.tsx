import { PageContainer, type ProColumns } from '@ant-design/pro-components';
import { RKTable } from '@rklink/components';
import { Tabs, Tag } from 'antd';
import {
  assetCatalog,
  sensitiveCatalog,
  sourceTypeLabel,
  type AssetCatalogRow,
  type SensitiveCatalogRow,
} from '../mock';

const Assets = () => {
  const queryAssets = async () => ({
    code: 200,
    data: assetCatalog,
    total: assetCatalog.length,
  });

  const querySensitiveFields = async () => ({
    code: 200,
    data: sensitiveCatalog,
    total: sensitiveCatalog.length,
  });

  const assetColumns: ProColumns<AssetCatalogRow>[] = [
    { title: '业务域', dataIndex: 'domain', width: 100 },
    { title: '数据源', dataIndex: 'source', width: 240, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'dbType',
      width: 110,
      render: (_, record) => sourceTypeLabel[record.dbType],
    },
    { title: 'Schema', dataIndex: 'schema', width: 130 },
    { title: '表名', dataIndex: 'tableName', width: 160 },
    { title: '记录数', dataIndex: 'rows', width: 120, align: 'right' },
    {
      title: '敏感等级',
      dataIndex: 'sensitivity',
      width: 100,
      render: (_, record) => (
        <Tag
          color={
            record.sensitivity === '高'
              ? 'red'
              : record.sensitivity === '中'
              ? 'gold'
              : 'green'
          }
        >
          {record.sensitivity}
        </Tag>
      ),
    },
    { title: '责任团队', dataIndex: 'owner', width: 180 },
  ];

  const sensitiveColumns: ProColumns<SensitiveCatalogRow>[] = [
    { title: '字段', dataIndex: 'field', width: 170 },
    { title: '敏感类型', dataIndex: 'type', width: 110 },
    {
      title: '等级',
      dataIndex: 'level',
      width: 90,
      render: (_, record) => (
        <Tag
          color={
            record.level === '核心'
              ? 'red'
              : record.level === '重要'
              ? 'gold'
              : 'blue'
          }
        >
          {record.level}
        </Tag>
      ),
    },
    { title: '脱敏规则', dataIndex: 'maskRule', width: 220 },
    { title: '示例', dataIndex: 'example', width: 160 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (_, record) => (
        <Tag color={record.status === '启用' ? 'green' : 'default'}>
          {record.status}
        </Tag>
      ),
    },
  ];

  return (
    <PageContainer
      title="数据资产与脱敏"
      subTitle="资产目录与敏感字段脱敏规则集中管理"
    >
      <Tabs
        defaultActiveKey="assets"
        items={[
          {
            key: 'assets',
            label: `资产目录（${assetCatalog.length}）`,
            children: (
              <RKTable<AssetCatalogRow>
                rowKey="key"
                headerTitle="资产目录"
                size="small"
                columns={assetColumns}
                requestApi={queryAssets}
                defaultPageSize={10}
                search={false}
                scroll={{ x: 1260 }}
              />
            ),
          },
          {
            key: 'sensitive-fields',
            label: `敏感字段目录（${sensitiveCatalog.length}）`,
            children: (
              <RKTable<SensitiveCatalogRow>
                rowKey="key"
                headerTitle="敏感字段目录"
                size="small"
                columns={sensitiveColumns}
                requestApi={querySensitiveFields}
                defaultPageSize={10}
                search={false}
                scroll={{ x: 900 }}
              />
            ),
          },
        ]}
      />
    </PageContainer>
  );
};

export default Assets;
