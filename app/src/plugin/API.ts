import {confirmDialog} from "../dialog/confirmDialog";
import {Plugin} from "./index";
import {showMessage} from "../dialog/message";
import {Dialog} from "../dialog";
import {fetchGet, fetchPost, fetchSyncPost} from "../util/fetch";
import {getBackend, getFrontend} from "../util/functions";
/// #if !MOBILE
import {openFile, openFileById} from "../editor/util";
import {openNewWindow, openNewWindowById} from "../window/openNewWindow";
import {Tab} from "../layout/Tab";
/// #endif
import {updateHotkeyTip} from "../protyle/util/compatibility";
import * as platformUtils from "../protyle/util/compatibility";
import {App} from "../index";
import {Constants} from "../constants";
import {Setting} from "./Setting";
import {Menu} from "./Menu";
import {Protyle} from "../protyle";
import {openMobileFileById} from "../mobile/editor";
import {lockScreen, exitSiYuan} from "../dialog/processSystem";
import {Model} from "../layout/Model";
import {getDockByType} from "../layout/tabUtil";
/// #if !MOBILE
import {getAllModels} from "../layout/getAll";
/// #endif
import {getAllEditor} from "../layout/getAll";
import {openSetting} from "../config";
import {openAttr, openFileAttr} from "../menus/commonMenuItem";
import {globalCommand} from "../boot/globalEvent/command/global";
import {exportLayout} from "../layout/util";
import {saveScroll} from "../protyle/scroll/saveScroll";

let openTab;
let openWindow;
/// #if MOBILE
openTab = () => {
    // TODO: Mobile
};
openWindow = () => {
    // TODO: Mobile
};
/// #else
openWindow = (options: {
    position?: IPosition,
    height?: number,
    width?: number,
    tab?: Tab,
    doc?: {
        id: string,     // 块 id
    },
}) => {
    if (options.doc && options.doc.id) {
        openNewWindowById(options.doc.id, {position: options.position, width: options.width, height: options.height});
        return;
    }
    if (options.tab) {
        openNewWindow(options.tab, {position: options.position, width: options.width, height: options.height});
        return;
    }
};

openTab = (options: {
    app: App,
    doc?: {
        id: string,     // 块 id
        action?: TProtyleAction [] // cb-get-all：获取所有内容；cb-get-focus：打开后光标定位在 id 所在的块；cb-get-hl: 打开后 id 块高亮
        zoomIn?: boolean // 是否缩放
    },
    pdf?: {
        path: string,
        page?: number,  // pdf 页码
        id?: string,    // File Annotation id
    },
    asset?: {
        path: string,
    },
    search?: Config.IUILayoutTabSearchConfig
    card?: {
        type: TCardType,
        id?: string, //  cardType 为 all 时不传，否则传文档或笔记本 id
        title?: string //  cardType 为 all 时不传，否则传文档或笔记本名称
    },
    custom?: {
        title: string,
        icon: string,
        data?: any
        id: string
    }
    position?: "right" | "bottom",
    keepCursor?: boolean // 是否跳转到新 tab 上
    removeCurrentTab?: boolean // 在当前页签打开时需移除原有页签
    afterOpen?: (model?: Model) => void // 打开后回调
}) => {
    if (options.doc) {
        if (options.doc.zoomIn) {
            if (options.doc.action && !options.doc.action.includes(Constants.CB_GET_ALL)) {
                options.doc.action.push(Constants.CB_GET_ALL);
            } else {
                options.doc.action = [Constants.CB_GET_ALL];
            }
        }
        if (!options.doc.action) {
            options.doc.action = [];
        }
        return openFileById({
            app: options.app,
            keepCursor: options.keepCursor,
            removeCurrentTab: options.removeCurrentTab,
            position: options.position,
            afterOpen: options.afterOpen,
            id: options.doc.id,
            action: options.doc.action,
            zoomIn: options.doc.zoomIn
        });
    }
    if (options.asset) {
        return openFile({
            app: options.app,
            keepCursor: options.keepCursor,
            removeCurrentTab: options.removeCurrentTab,
            position: options.position,
            afterOpen: options.afterOpen,
            assetPath: options.asset.path,
        });
    }
    if (options.pdf) {
        return openFile({
            app: options.app,
            keepCursor: options.keepCursor,
            removeCurrentTab: options.removeCurrentTab,
            position: options.position,
            afterOpen: options.afterOpen,
            assetPath: options.pdf.path,
            page: options.pdf.id || options.pdf.page,
        });
    }
    if (options.search) {
        if (!options.search.idPath) {
            options.search.idPath = [];
        }
        if (!options.search.hPath) {
            options.search.hPath = "";
        }
        return openFile({
            app: options.app,
            keepCursor: options.keepCursor,
            removeCurrentTab: options.removeCurrentTab,
            position: options.position,
            afterOpen: options.afterOpen,
            searchData: options.search,
        });
    }
    if (options.card) {
        return openFile({
            app: options.app,
            keepCursor: options.keepCursor,
            removeCurrentTab: options.removeCurrentTab,
            position: options.position,
            afterOpen: options.afterOpen,
            custom: {
                icon: "iconRiffCard",
                title: window.siyuan.languages.spaceRepetition,
                data: {
                    cardType: options.card.type,
                    id: options.card.id || "",
                    title: options.card.title,
                },
                id: "siyuan-card"
            },
        });
    }
    if (options.custom) {
        return openFile(options);
    }

};
/// #endif

const getModelByDockType = (type: TDock | string) => {
    /// #if MOBILE
    return window.siyuan.mobile.docks[type];
    /// #else
    return getDockByType(type).data[type];
    /// #endif
};

const openAttributePanel = (options: {
    data?: IObject  // 块属性值
    nodeElement?: HTMLElement,  // 块元素
    focusName: "bookmark" | "name" | "alias" | "memo" | "av" | "custom",    // av 为数据库页签，custom 为自定义页签，其余为内置输入框
    protyle?: IProtyle, // 有数据库时需要传入 protyle
}) => {
    if (options.data) {
        openFileAttr(options.data, options.focusName, options.protyle);
    } else {
        openAttr(options.nodeElement, options.focusName, options.protyle);
    }
};

const saveLayout = (cb: () => void) => {
    /// #if MOBILE
    if (window.siyuan.mobile.editor) {
        const result = saveScroll(window.siyuan.mobile.editor.protyle);
        if (cb && result instanceof Promise) {
            result.then(() => {
                cb();
            });
        }
    }
    /// #else
    exportLayout({cb, errorExit: false});
    /// #endif
};

export const API = {
    adaptHotkey: updateHotkeyTip,
    confirm: confirmDialog,
    Constants,
    showMessage,
    fetchPost,
    fetchSyncPost,
    fetchGet,
    getFrontend,
    getBackend,
    getModelByDockType,
    openTab,
    openWindow,
    openMobileFileById,
    lockScreen,
    exitSiYuan,
    Protyle,
    Plugin,
    Dialog,
    Menu,
    Setting,
    getAllEditor,
    /// #if !MOBILE
    getAllModels,
    /// #endif
    platformUtils,
    openSetting,
    openAttributePanel,
    saveLayout,
    globalCommand,
};
