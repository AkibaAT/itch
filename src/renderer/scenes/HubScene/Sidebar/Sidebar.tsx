import classNames from "classnames";
import { User } from "common/butlerd/messages";
import {
  ambientNavigation,
  ambientWind,
  ambientWindState,
} from "common/util/navigation";
import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Filler from "renderer/basics/Filler";
import Icon from "renderer/basics/Icon";
import IconButton from "renderer/basics/IconButton";
import { hook } from "renderer/hocs/hook";
import Logo from "renderer/scenes/HubScene/Sidebar/Logo";
import Search from "renderer/scenes/HubScene/Sidebar/Search";
import {
  SidebarHeading,
  SidebarSection,
} from "renderer/scenes/HubScene/Sidebar/styles";
import Tab from "renderer/scenes/HubScene/Sidebar/Tab";
import styled, * as styles from "renderer/styles";
import { T, _ } from "renderer/t";
import { map } from "underscore";
import { actions } from "common/actions";
import { Dispatch, LocalizedString } from "common/types";
import equal from "react-fast-compare";
import PrimeDownload from "renderer/scenes/HubScene/Sidebar/PrimeDownload";

const SidebarDiv = styled.div`
  width: 240px;
  background: ${(props) => props.theme.sidebarBackground};
  font-size: ${styles.fontSizes.sidebar};

  animation: ${styles.animations.enterLeft} 0.2s;

  padding-bottom: 8px;

  height: 100%;
  flex-grow: 0;
  flex-shrink: 0;

  display: flex;
  align-items: stretch;
  flex-direction: column;
`;

const SidebarItems = styled.div`
  display: flex;
  align-items: stretch;
  flex-direction: column;

  overflow: hidden;

  &.no-shrink {
    flex-shrink: 0;
  }
`;

interface SortableContainerParams {
  items: string[];
  sidebarProps: Props;
}

const SortableListContainer = styled.div`
  overflow-y: auto;
`;

const SortableList = (params: SortableContainerParams) => {
  const { sidebarProps, items } = params;
  const currentTab = sidebarProps.tab;

  return (
    <SortableListContainer>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {map(items, (tab, index) => {
          const active = currentTab === tab;
          return (
            <Tab key={tab} tab={tab} active={active} index={index} sortable />
          );
        })}
      </SortableContext>
    </SortableListContainer>
  );
};

class Sidebar extends React.PureComponent<Props, State> {
  constructor(props: Sidebar["props"], context: any) {
    super(props, context);
    this.state = {
      openTabs: props.openTabs,
    };
  }

  closeAllTabs = () => {
    const { dispatch } = this.props;
    dispatch(
      actions.closeAllTabs({
        wind: ambientWind(),
      })
    );
  };

  newTab = () => {
    const { dispatch } = this.props;
    dispatch(
      actions.newTab({
        wind: ambientWind(),
      })
    );
  };

  onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = this.state.openTabs.indexOf(active.id as string);
      const newIndex = this.state.openTabs.indexOf(over?.id as string);

      this.setState({
        openTabs: arrayMove(this.state.openTabs, oldIndex, newIndex),
      });
      const { dispatch } = this.props;
      dispatch(
        actions.moveTab({
          wind: ambientWind(),
          before: oldIndex,
          after: newIndex,
        })
      );
    }
  };

  render() {
    const { enableTabs } = this.props;

    return (
      <SidebarDiv id="sidebar">
        <Logo />

        <Search />

        {enableTabs ? this.renderTabs() : this.renderShortcuts()}
        {this.renderShortcutsRest()}
      </SidebarDiv>
    );
  }

  renderTabs(): React.ReactElement {
    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    return (
      <>
        <SidebarItems>
          <SidebarSection>
            <SidebarHeading>{T(["sidebar.category.tabs"])}</SidebarHeading>
            <Filler />
            <IconButton
              icon="delete"
              id="sidebar-close-all-tabs"
              hint={_("sidebar.close_all_tabs")}
              hintPosition="left"
              onClick={this.closeAllTabs}
            />
            <IconButton
              id="new-tab-icon"
              icon="plus"
              hint={_("sidebar.new_tab")}
              hintPosition="left"
              onClick={this.newTab}
            />
          </SidebarSection>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={this.onDragEnd}
          >
            <SortableList
              items={this.state.openTabs}
              sidebarProps={this.props}
            />
          </DndContext>
        </SidebarItems>
      </>
    );
  }

  renderShortcuts(): React.ReactElement {
    return (
      <>
        <SidebarItems>
          {this.renderLink("itch://featured", "earth", ["sidebar.explore"])}
          {this.renderLink("itch://library", "heart-filled", [
            "sidebar.library",
          ])}
          {this.renderLink("itch://collections", "video_collection", [
            "sidebar.collections",
          ])}
          {this.renderLink("itch://dashboard", "archive", [
            "sidebar.dashboard",
          ])}
        </SidebarItems>
      </>
    );
  }

  renderShortcutsRest(): React.ReactElement {
    return (
      <>
        <div style={{ flexGrow: 1 }} />
        <PrimeDownload />
        <SidebarItems className="no-shrink">
          {this.renderLink("itch://downloads", "download", [
            "sidebar.downloads",
          ])}
          {this.renderLink("itch://preferences", "cog", [
            "sidebar.preferences",
          ])}
        </SidebarItems>
      </>
    );
  }

  renderLink(
    url: string,
    icon: string,
    label: LocalizedString
  ): React.ReactElement {
    return (
      <SidebarSection>
        <a
          href={url}
          className={classNames({ active: this.props.url.startsWith(url) })}
        >
          <Icon icon={icon} /> {T(label)}
        </a>
      </SidebarSection>
    );
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> {
    if (!equal(props.openTabs, state.openTabs)) {
      return {
        openTabs: props.openTabs,
      };
    }

    return null;
  }
}

interface Props {
  me: User;

  tab: string;
  openTabs: string[];
  enableTabs: boolean;
  url: string;

  dispatch: Dispatch;
}

interface State {
  openTabs: string[];
}

export default hook((map) => ({
  me: map((rs) => rs.profile.profile.user),

  tab: map((rs) => {
    const nav = ambientNavigation(rs);
    return nav ? nav.tab : "";
  }),
  openTabs: map((rs) => {
    const nav = ambientNavigation(rs);
    return nav ? nav.openTabs : [];
  }),
  enableTabs: map((rs) => rs.preferences.enableTabs),
  url: map((rs) => {
    const ws = ambientWindState(rs);
    const nav = ambientNavigation(rs);
    if (!ws || !nav || !ws.tabInstances) {
      return "";
    }
    const ti = ws.tabInstances[nav.tab];
    if (!ti || !ti.history || !ti.history[ti.currentIndex]) {
      return "";
    }
    return ti.history[ti.currentIndex].url;
  }),
}))(Sidebar);
