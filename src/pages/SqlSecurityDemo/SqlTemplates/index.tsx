import { CopyOutlined } from '@ant-design/icons';
import { PageContainer, type ProColumns } from '@ant-design/pro-components';
import { RKTable } from '@rklink/components';
import { App, Button, Tag, Typography } from 'antd';
import { dataSources, sourceTypeLabel, sqlTemplates, type DbKind } from '../mock';

const { Text } = Typography;

type SqlTemplateRow = (typeof sqlTemplates)[number] & {
  key: string;
  sourceName: string;
  dbType: DbKind;
  environment: string;
};

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

const SqlTemplates = () => {
  const { message } = App.useApp();
  const rows: SqlTemplateRow[] = sqlTemplates.map((template) => {
    const source =
      dataSources.find((item) => item.id === template.sourceId) ||
      dataSources[0];

    return {
      ...template,
      key: template.name,
      sourceName: source.name,
      dbType: source.dbType,
      environment: source.environment,
    };
  });

  const queryTemplates = async () => ({
    code: 200,
    data: rows,
    total: rows.length,
  });

  const columns: ProColumns<SqlTemplateRow>[] = [
    {
      title: '场景',
      dataIndex: 'name',
      width: 160,
      fixed: 'left',
    },
    {
      title: '目标库',
      dataIndex: 'sourceName',
      width: 240,
      ellipsis: true,
    },
    {
      title: '数据库类型',
      dataIndex: 'dbType',
      width: 120,
      render: (_, record) => sourceTypeLabel[record.dbType],
    },
    {
      title: '环境',
      dataIndex: 'environment',
      width: 90,
      render: (_, record) => (
        <Tag
          color={
            record.environment === '生产'
              ? 'red'
              : record.environment === '测试'
              ? 'gold'
              : 'blue'
          }
        >
          {record.environment}
        </Tag>
      ),
    },
    {
      title: 'SQL',
      dataIndex: 'sql',
      ellipsis: true,
      render: (_, record) => <Text code>{record.sql}</Text>,
    },
    {
      title: '操作',
      key: 'option',
      align: 'center',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          icon={<CopyOutlined />}
          onClick={async () => {
            await copyText(record.sql);
            message.success('已复制 SQL');
          }}
        >
          复制
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="SQL 样例库"
      subTitle="演示 SQL 场景集中维护，复制后到工作台审核执行"
    >
      <RKTable<SqlTemplateRow>
        rowKey="key"
        headerTitle="SQL 样例列表"
        size="small"
        columns={columns}
        requestApi={queryTemplates}
        defaultPageSize={10}
        search={false}
        scroll={{ x: 1200 }}
      />
    </PageContainer>
  );
};

export default SqlTemplates;
