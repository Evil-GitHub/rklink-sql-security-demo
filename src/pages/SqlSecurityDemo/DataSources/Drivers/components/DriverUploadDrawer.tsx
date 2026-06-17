import { PaperClipOutlined } from "@ant-design/icons";
import {
  DrawerForm,
  ProFormItem,
  ProFormSelect,
  ProFormText,
  ProFormUploadButton,
} from "@ant-design/pro-components";
import { useRequest } from "@umijs/max";
import { message } from "antd";
import type { FC } from "react";
import type {
  DatabaseDriverPackage,
  DbKind,
} from "../../../mock";
import {
  createMockDriverPackage,
  type DriverPackagePayload,
  updateMockDriverPackage,
} from "../../../mockApi";

type SelectOption = {
  label?: string | number;
  value?: string | number;
};

type DriverUploadFormValues = Partial<DriverPackagePayload> & {
  file?: { originFileObj?: File; name?: string }[];
};

type DriverUploadDrawerProps = {
  open: boolean;
  driver?: DatabaseDriverPackage;
  dbTypeOptions: SelectOption[];
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const requiredRule = {
  required: true,
  message: "此项为必填项",
};

const DriverUploadDrawer: FC<DriverUploadDrawerProps> = ({
  open,
  driver,
  dbTypeOptions,
  onOpenChange,
  onSuccess,
}) => {
  const isEdit = !!driver?.id;
  const { run: uploadDriver, loading } = useRequest(
    async (values: DriverUploadFormValues) => {
      const file = isEdit ? undefined : values.file?.[0]?.originFileObj;
      const originalFileName =
        values.file?.[0]?.name ||
        values.file?.[0]?.originFileObj?.name ||
        values.originalFileName;
      const driverMeta: DriverPackagePayload = {
        name: values.name!,
        dbType: values.dbType as DbKind,
        driverIdentifier: values.driverIdentifier!,
        driverClassName: values.driverClassName,
        originalFileName,
      };

      if (!file && !isEdit) {
        message.error("请上传 JDBC 驱动文件");
        return {
          code: 400,
        };
      }

      return isEdit
        ? updateMockDriverPackage(driver.id, driverMeta)
        : createMockDriverPackage(driverMeta);
    },
    {
      manual: true,
      formatResult: (res) => res,
      onSuccess: (res) => {
        if (res?.success || res?.code === 200) {
          message.success(isEdit ? "保存成功" : "上传成功");
          onOpenChange(false);
          onSuccess?.();
          return;
        }

        message.error("上传失败");
      },
    },
  );

  const handleFinish = async (values: DriverUploadFormValues) => {
    await uploadDriver(values);
    return false;
  };

  return (
    <DrawerForm<DriverUploadFormValues>
      title={isEdit ? "编辑驱动" : "新建驱动"}
      width={560}
      open={open}
      onOpenChange={onOpenChange}
      params={{
        driverId: driver?.id,
        open,
      }}
      request={async () => {
        if (!open || !driver) {
          return {};
        }
        return driver;
      }}
      drawerProps={{
        destroyOnHidden: true,
        maskClosable: false,
      }}
      submitter={{
        submitButtonProps: {
          loading,
        },
      }}
      onFinish={handleFinish}
      disabled={loading}
    >
      <ProFormItem hidden>
        <ProFormText name="driverClassName" />
      </ProFormItem>
      <ProFormText name="name" label="驱动名称" rules={[requiredRule]} />
      <ProFormSelect
        name="dbType"
        label="数据库类型"
        options={dbTypeOptions}
        rules={[requiredRule]}
        fieldProps={{
          showSearch: true,
          optionFilterProp: "label",
        }}
      />
      <ProFormText
        name="driverIdentifier"
        label="标签"
        rules={[requiredRule]}
      />

      {isEdit ? (
        <ProFormText
          name="originalFileName"
          label="驱动文件"
          readonly
          fieldProps={{
            prefix: <PaperClipOutlined />,
          }}
        />
      ) : (
        <ProFormUploadButton
          name="file"
          label="驱动文件"
          tooltip="仅支持.jar格式"
          buttonProps={{
            type: "primary",
            variant: "outlined",
            color: "blue",
          }}
          max={1}
          rules={[requiredRule]}
          fieldProps={{
            accept: ".jar",
            beforeUpload: () => false,
          }}
        />
      )}
    </DrawerForm>
  );
};

export default DriverUploadDrawer;
