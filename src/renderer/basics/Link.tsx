import React from "react";
import styled, * as styles from "renderer/styles";

interface Props {
  onClick?: React.EventHandler<React.MouseEvent<HTMLButtonElement>>;
  onContextMenu?: React.EventHandler<React.MouseEvent<HTMLButtonElement>>;
  label?: React.ReactElement | string;
  children?: string | React.ReactElement | (string | React.ReactElement)[];
  className?: string;
}

const LinkButton = styled.button`
  ${styles.resetButton};

  ${styles.secondaryLink};

  transition: color 0.4s;
  flex-shrink: 0.1;
  overflow-x: hidden;
  text-overflow: ellipsis;
`;

const Link: React.FC<Props> = (props) => {
  const { label, children, ...restProps } = props;

  return (
    <LinkButton type="button" {...restProps}>
      {label}
      {children}
    </LinkButton>
  );
};

export default React.memo(Link);
