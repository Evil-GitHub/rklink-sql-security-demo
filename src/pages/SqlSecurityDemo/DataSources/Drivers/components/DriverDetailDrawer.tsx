import type { DescriptionsProps } from "antd";
import { Descriptions, Drawer } from "antd";
import type { FC } from "react";
import type { DatabaseDriverPackage } from "../../../mock";

type DriverDetailDrawerProps = {
  open: boolean;
  driver?: DatabaseDriverPackage;
  dbTypeMap: Map<string, string>;
  onClose: () => void;
};

const formatText = (value?: string | number | null) =>
  value === undefined || value === null || value === "" ? "-" : value;

const DriverDetailDrawer: FC<DriverDetailDrawerProps> = ({
  open,
  driver,
  dbTypeMap,
  onClose,
}) => {
  const items: DescriptionsProps["items"] = [
    {
      key: "name",
      label: "驱动名称",
      children: formatText(driver?.name),
    },
    {
      key: "dbType",
      label: "数据库类型",
      children: driver?.dbType
        ? dbTypeMap.get(driver.dbType) || driver.dbType
        : "-",
    },
    {
      key: "driverIdentifier",
      label: "标签",
      children: formatText(driver?.driverIdentifier),
    },
    {
      key: "originalFileName",
      label: "驱动文件",
      children: formatText(driver?.originalFileName),
    },
  ];

  return (
    <Drawer
      width={560}
      title="驱动详情"
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      <Descriptions column={1} items={items} />
    </Drawer>
  );
};

export default DriverDetailDrawer;
