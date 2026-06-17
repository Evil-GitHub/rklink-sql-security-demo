import type { TablePaginationConfig } from 'antd';

export const tablePagination: TablePaginationConfig = {
  pageSize: 5,
  showSizeChanger: false,
  hideOnSinglePage: false,
  showTotal: (total) => `共 ${total} 条`,
};
