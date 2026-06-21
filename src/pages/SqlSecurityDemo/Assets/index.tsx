import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  RKConfirmAction,
  RKTable,
  createRKTableConditionRequestParamsFormatter,
  type RKTableConditionRequestParams,
  type RKTableRequestCondition,
} from '@rklink/components';
import { App, Button, Space, Tabs, Tag } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { appendAuditLog } from '../auditStore';
import { readCurrentDemoUserId } from '../currentUserStore';
import {
  assetCatalog,
  createSensitiveCatalogConfig,
  deleteSensitiveCatalogConfigs,
  readSensitiveCatalog,
  sensitiveCatalog,
  sourceTypeLabel,
  subscribeSensitiveCatalogChange,
  updateSensitiveCatalogConfig,
  type AssetCatalogRow,
  type RiskLevel,
  type SensitiveCatalogPayload,
  type SensitiveCatalogRow,
} from '../mock';
import { readDemoUserAccounts } from '../userStore';

type SensitiveFormValues = SensitiveCatalogPayload;

const sensitiveLevelColorMap: Record<SensitiveCatalogRow['level'], string> = {
  一般: 'blue',
  重要: 'gold',
  核心: 'red',
};

const sensitiveStatusColorMap: Record<SensitiveCatalogRow['status'], string> = {
  启用: 'green',
  待确认: 'default',
};

const sensitiveLevelOptions = Object.keys(sensitiveLevelColorMap).map(
  (value) => ({ label: value, value }),
);

const sensitiveStatusOptions = Object.keys(sensitiveStatusColorMap).map(
  (value) => ({ label: value, value }),
);

const sensitiveLevelValueEnum = Object.fromEntries(
  Object.keys(sensitiveLevelColorMap).map((value) => [value, { text: value }]),
);

const sensitiveStatusValueEnum = Object.fromEntries(
  Object.keys(sensitiveStatusColorMap).map((value) => [
    value,
    { text: value },
  ]),
);

const SENSITIVE_LIST_CONDITIONS = {
  field: 'like',
  type: 'like',
  level: 'eq',
  status: 'eq',
} as const;

const defaultSensitiveValues: SensitiveFormValues = {
  field: '',
  type: '',
  level: '重要',
  maskRule: '',
  example: '',
  status: '启用',
};

const getConditionValue = (
  conditions: RKTableRequestCondition[] = [],
  field: string,
) => conditions.find((item) => item.field === field)?.value;

const filterText = (value: string | undefined, keyword: unknown) => {
  const text = String(keyword || '')
    .trim()
    .toLowerCase();
  if (!text) return true;

  return String(value || '')
    .toLowerCase()
    .includes(text);
};

const Assets = () => {
  const { message } = App.useApp();
  const sensitiveActionRef = useRef<ActionType>();
  const [sensitiveFields, setSensitiveFields] = useState<SensitiveCatalogRow[]>(
    () => readSensitiveCatalog(),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSensitiveField, setEditingSensitiveField] =
    useState<SensitiveCatalogRow>();
  const currentUserName = useMemo(() => {
    const currentUserId = readCurrentDemoUserId();
    return (
      readDemoUserAccounts().find((user) => user.id === currentUserId)?.name ||
      '当前用户'
    );
  }, []);

  useEffect(
    () =>
      subscribeSensitiveCatalogChange(() => {
        setSensitiveFields(readSensitiveCatalog());
        sensitiveActionRef.current?.reload();
      }),
    [],
  );

  const reloadSensitiveFields = () => {
    setSensitiveFields(readSensitiveCatalog());
    sensitiveActionRef.current?.reload();
  };

  const appendSensitiveAudit = (
    action: string,
    note: string,
    risk: RiskLevel = 'medium',
  ) => {
    appendAuditLog({
      module: '数据资产',
      action,
      user: currentUserName,
      source: '敏感字段目录',
      sqlType: 'CONFIG',
      decision: '操作成功',
      risk,
      note,
    });
  };

  const queryAssets = async () => ({
    code: 200,
    data: assetCatalog,
    total: assetCatalog.length,
  });

  const querySensitiveFields = async (
    params: RKTableConditionRequestParams,
  ) => {
    const pageNum = Number(params.pageNum || 1);
    const pageSize = Number(params.pageSize || 10);
    const conditions = params.conditions || [];
    const field = getConditionValue(conditions, 'field');
    const type = getConditionValue(conditions, 'type');
    const level = getConditionValue(conditions, 'level');
    const status = getConditionValue(conditions, 'status');
    const rows = sensitiveFields.filter(
      (item) =>
        filterText(item.field, field) &&
        filterText(item.type, type) &&
        (!level || item.level === level) &&
        (!status || item.status === status),
    );
    const start = (pageNum - 1) * pageSize;

    return {
      code: 200,
      data: rows.slice(start, start + pageSize),
      total: rows.length,
    };
  };

  const openCreateDrawer = () => {
    setEditingSensitiveField(undefined);
    setDrawerOpen(true);
  };

  const openEditDrawer = (record: SensitiveCatalogRow) => {
    setEditingSensitiveField(record);
    setDrawerOpen(true);
  };

  const toggleSensitiveStatus = (record: SensitiveCatalogRow) => {
    const nextStatus = record.status === '启用' ? '待确认' : '启用';
    updateSensitiveCatalogConfig(record.key, {
      ...record,
      status: nextStatus,
    });
    appendSensitiveAudit(
      '敏感字段状态变更',
      `字段 ${record.field} 状态由 ${record.status} 调整为 ${nextStatus}。`,
      nextStatus === '待确认' ? 'high' : 'medium',
    );
    reloadSensitiveFields();
    message.success('操作成功');
  };

  const deleteSensitiveField = async (record: SensitiveCatalogRow) => {
    deleteSensitiveCatalogConfigs([record.key]);
    appendSensitiveAudit(
      '敏感字段删除',
      `删除敏感字段配置 ${record.field}（${record.type}）。`,
      'high',
    );
    reloadSensitiveFields();
    return { code: 200 };
  };

  const handleSubmit = async (values: SensitiveFormValues) => {
    const payload: SensitiveCatalogPayload = {
      ...values,
      field: String(values.field || '').trim(),
      type: String(values.type || '').trim(),
      maskRule: String(values.maskRule || '').trim(),
      example: String(values.example || '').trim(),
    };

    if (!payload.field) {
      message.warning('请输入字段表达式');
      return false;
    }
    if (!payload.type) {
      message.warning('请输入敏感类型');
      return false;
    }
    if (!payload.maskRule) {
      message.warning('请输入脱敏规则');
      return false;
    }

    if (editingSensitiveField) {
      updateSensitiveCatalogConfig(editingSensitiveField.key, payload);
      appendSensitiveAudit(
        '敏感字段更新',
        `更新敏感字段 ${editingSensitiveField.field} -> ${payload.field}；类型 ${editingSensitiveField.type} -> ${payload.type}；等级 ${editingSensitiveField.level} -> ${payload.level}；状态 ${editingSensitiveField.status} -> ${payload.status}。`,
      );
    } else {
      createSensitiveCatalogConfig(payload);
      appendSensitiveAudit(
        '敏感字段创建',
        `新增敏感字段 ${payload.field}；类型 ${payload.type}；等级 ${payload.level}；状态 ${payload.status}。`,
      );
    }

    setDrawerOpen(false);
    reloadSensitiveFields();
    message.success('保存成功');
    return true;
  };

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
    { title: '字段', dataIndex: 'field', width: 220 },
    { title: '敏感类型', dataIndex: 'type', width: 120 },
    {
      title: '等级',
      dataIndex: 'level',
      valueEnum: sensitiveLevelValueEnum,
      width: 90,
      render: (_, record) => (
        <Tag color={sensitiveLevelColorMap[record.level]}>{record.level}</Tag>
      ),
    },
    { title: '脱敏规则', dataIndex: 'maskRule', width: 260, search: false },
    { title: '示例', dataIndex: 'example', width: 220, search: false },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: sensitiveStatusValueEnum,
      width: 90,
      render: (_, record) => (
        <Tag color={sensitiveStatusColorMap[record.status]}>
          {record.status}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 190,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            size="small"
            type="link"
            onClick={() => openEditDrawer(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => toggleSensitiveStatus(record)}
          >
            {record.status === '启用' ? '待确认' : '启用'}
          </Button>
          <RKConfirmAction
            size="small"
            request={() => deleteSensitiveField(record)}
            confirm={{
              title: '确认删除敏感字段',
              content: `确认删除 ${record.field} 的脱敏配置吗？`,
            }}
            successMessage="删除成功"
          >
            删除
          </RKConfirmAction>
        </Space>
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
            label: `敏感字段目录（${sensitiveFields.length}）`,
            children: (
              <RKTable<
                SensitiveCatalogRow,
                Record<string, unknown>,
                'text',
                RKTableConditionRequestParams
              >
                actionRef={sensitiveActionRef}
                rowKey="key"
                headerTitle="敏感字段目录"
                size="small"
                columns={sensitiveColumns}
                requestApi={querySensitiveFields}
                requestParamsFormatter={createRKTableConditionRequestParamsFormatter(
                  SENSITIVE_LIST_CONDITIONS,
                )}
                defaultPageSize={10}
                search={{ labelWidth: 80 }}
                scroll={{ x: 1100 }}
                toolBarRender={() => [
                  <Button
                    key="create"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreateDrawer}
                  >
                    新增敏感字段
                  </Button>,
                ]}
              />
            ),
          },
        ]}
      />

      <DrawerForm<SensitiveFormValues>
        key={editingSensitiveField?.key || 'create'}
        title={editingSensitiveField ? '编辑敏感字段' : '新增敏感字段'}
        width={640}
        open={drawerOpen}
        initialValues={editingSensitiveField || defaultSensitiveValues}
        drawerProps={{
          destroyOnHidden: true,
          maskClosable: false,
        }}
        onOpenChange={(visible) => {
          setDrawerOpen(visible);
          if (!visible) setEditingSensitiveField(undefined);
        }}
        submitter={{
          searchConfig: {
            submitText: '保存',
            resetText: '取消',
          },
        }}
        onFinish={handleSubmit}
      >
        <ProFormText
          name="field"
          label="字段表达式"
          placeholder="例如 customer_info.mobile / employee_salary.mobile"
          rules={[{ required: true, message: '请输入字段表达式' }]}
        />
        <ProFormText
          name="type"
          label="敏感类型"
          placeholder="例如 手机号、身份证号、银行卡号"
          rules={[{ required: true, message: '请输入敏感类型' }]}
        />
        <ProFormSelect
          name="level"
          label="敏感等级"
          options={sensitiveLevelOptions}
          rules={[{ required: true, message: '请选择敏感等级' }]}
        />
        <ProFormTextArea
          name="maskRule"
          label="脱敏规则"
          fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }}
          rules={[{ required: true, message: '请输入脱敏规则' }]}
        />
        <ProFormTextArea
          name="example"
          label="展示示例"
          fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }}
          rules={[{ required: true, message: '请输入展示示例' }]}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={sensitiveStatusOptions}
          rules={[{ required: true, message: '请选择状态' }]}
        />
      </DrawerForm>
    </PageContainer>
  );
};

export default Assets;
