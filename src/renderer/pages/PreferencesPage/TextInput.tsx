import { actions } from "common/actions";
import { Dispatch, PreferencesState } from "common/types";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import Label from "renderer/pages/PreferencesPage/Label";
import styled from "renderer/styles";

const InputEl = styled.input`
  background: ${(props) => props.theme.inputBackground || "#2c2c2c"};
  border: 1px solid ${(props) => props.theme.inputBorder || "#555"};
  border-radius: 3px;
  color: ${(props) => props.theme.inputText || "#fff"};
  padding: 6px 8px;
  font-size: 13px;
  width: 100%;
  margin-top: 4px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.accent};
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-left: 8px;
`;

class TextInput extends React.PureComponent<Props> {
  render() {
    const { value, label, placeholder } = this.props;

    return (
      <Label active={!!value}>
        <InputContainer>
          <span>{label}</span>
          <InputEl
            type="text"
            value={value || ""}
            placeholder={placeholder}
            onChange={this.onChange}
          />
        </InputContainer>
      </Label>
    );
  }

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, dispatch } = this.props;
    const value = e.currentTarget.value.trim();
    dispatch(actions.updatePreferences({ [name]: value || undefined }));
  };
}

interface Props {
  name: keyof PreferencesState;
  label: string | React.ReactElement;
  placeholder?: string;

  dispatch: Dispatch;
  value: string | undefined;
}

export default hookWithProps(TextInput)((map) => ({
  value: map((rs, props) => rs.preferences[props.name] as string | undefined),
}))(TextInput);
