import { ExploreJsonParams, ExploreJsonResponse } from "common/modals/types";
import React from "react";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled, * as styles from "renderer/styles";
import { ModalWidgetProps } from "common/modals";
import { JSONTree } from "react-json-tree";

class ExploreJson extends React.PureComponent<Props> {
  render() {
    const params = this.props.modal.widgetParams;
    const { data } = params;

    return (
      <ModalWidgetDiv>
        <JSONTreeContainer>
          <JSONTree
            data={data}
            theme="bright"
            invertTheme={false}
            shouldExpandNodeInitially={() => true}
          />
        </JSONTreeContainer>
      </ModalWidgetDiv>
    );
  }
}

const JSONTreeContainer = styled.div`
  width: 100%;
  user-select: initial;
  font-family: monospace;
  font-size: 12px;

  ul {
    list-style: none;
    margin: 0;
    padding: 0 0 0 1em;
  }

  li {
    margin: 0;
    padding: 0;
  }
`;

// props

interface Props
  extends ModalWidgetProps<ExploreJsonParams, ExploreJsonResponse> {}

export default ExploreJson;
