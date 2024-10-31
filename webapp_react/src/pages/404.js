import {Button, Result} from 'antd';
import Link from 'next/link';
import React from 'react';

const NotFoundPage = () => {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Link href="/" passHref>
          <Button type="primary">Back Home</Button>
        </Link>
      }
    />
  );
};

export default NotFoundPage;
