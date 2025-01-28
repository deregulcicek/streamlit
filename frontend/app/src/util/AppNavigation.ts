/**
 * Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022-2025)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AppRoot,
  BlockNode,
  HostCommunicationManager,
  IAppPage,
  Navigation,
  NewSession,
  PageConfig,
  PageNotFound,
  PagesChanged,
} from "@streamlit/lib"

interface AppNavigationState {
  expandSidebarNav: boolean
  hideSidebarNav: boolean
  appPages: IAppPage[]
  currentPageScriptHash: string
  navSections: string[]
}

export type StateUpdate = [Partial<AppNavigationState>, () => void]
export type PageUrlUpdateCallback = (
  mainPageName: string,
  newPageName: string,
  isViewingMainPage: boolean
) => void
export type PageNotFoundCallback = (pageName?: string) => void
export type SetIconCallback = (icon: string) => void

function getTitle(pageName: string): string {
  if (!pageName) {
    return "Streamlit"
  }

  return pageName
}

export class AppNavigation {
  readonly hostCommunicationMgr: HostCommunicationManager

  readonly onUpdatePageUrl: PageUrlUpdateCallback

  readonly onPageNotFound: PageNotFoundCallback

  readonly onPageIconChange: SetIconCallback

  isPageTitleSet: boolean

  isPageIconSet: boolean

  private currentPageScriptHash: string | null

  mainScriptHash: string | null

  hideSidebarNav: boolean | null

  appPages: IAppPage[]

  mainPage: IAppPage | null

  // MPAv1 = Multi Page App Version 1 (with a pages folder)
  isMPAv1: boolean

  constructor(
    hostCommunicationMgr: HostCommunicationManager,
    onUpdatePageUrl: PageUrlUpdateCallback,
    onPageNotFound: PageNotFoundCallback,
    onPageIconChange: SetIconCallback
  ) {
    this.hostCommunicationMgr = hostCommunicationMgr
    this.onUpdatePageUrl = onUpdatePageUrl
    this.onPageNotFound = onPageNotFound
    this.onPageIconChange = onPageIconChange
    this.isPageIconSet = false
    this.isPageTitleSet = false
    this.mainScriptHash = null
    this.hideSidebarNav = null
    this.currentPageScriptHash = null
    this.appPages = []
    this.mainPage = null
    this.isMPAv1 = false
  }

  handleNewSession(newSession: NewSession): StateUpdate {
    this.isPageTitleSet = false
    this.isPageIconSet = false
    this.currentPageScriptHash = newSession.pageScriptHash

    this.mainScriptHash = newSession.mainScriptHash
    // Initialize to the config value if provided
    if (this.hideSidebarNav === null) {
      this.hideSidebarNav = newSession.config?.hideSidebarNav ?? null
    }

    // We do not know the page name, so use an empty string version
    document.title = getTitle("")

    return [
      {
        hideSidebarNav: this.hideSidebarNav ?? false,
        currentPageScriptHash: this.currentPageScriptHash,
      },
      () => {},
    ]
  }

  handleNavigation(navigationMsg: Navigation): StateUpdate {
    const { sections, position, appPages, isMpaV1 } = navigationMsg

    this.isMPAv1 = isMpaV1
    this.appPages = appPages
    this.hideSidebarNav = position === Navigation.Position.HIDDEN

    const currentPageScriptHash = navigationMsg.pageScriptHash
    const currentPage = appPages.find(
      p => p.pageScriptHash === currentPageScriptHash
    ) as IAppPage
    const mainPage = appPages.find(p => p.isDefault) as IAppPage
    this.mainPage = mainPage
    const currentPageName = currentPage.urlPathname as string

    if (!this.isPageTitleSet) {
      const title = getTitle(currentPage.pageName as string)
      document.title = title
      this.hostCommunicationMgr.sendMessageToHost({
        type: "SET_PAGE_TITLE",
        title: currentPage.pageName ?? "",
      })
    }

    if (!this.isPageIconSet && currentPage.icon) {
      this.onPageIconChange(currentPage.icon)
    }

    this.onUpdatePageUrl(
      mainPage.urlPathname ?? "",
      currentPageName,
      currentPage.isDefault ?? false
    )

    return [
      {
        appPages,
        navSections: sections,
        hideSidebarNav: this.hideSidebarNav,
        expandSidebarNav: navigationMsg.expanded,
        currentPageScriptHash,
      },
      () => {
        this.hostCommunicationMgr.sendMessageToHost({
          type: "SET_APP_PAGES",
          appPages,
        })

        this.hostCommunicationMgr.sendMessageToHost({
          type: "SET_CURRENT_PAGE_NAME",
          // Make sure we don't send the official page name for the main page
          // This command is used to update the URL in the url bar, so the main page
          // should not have a page name in the URL.
          currentPageName: currentPage.isDefault ? "" : currentPageName,
          currentPageScriptHash,
        })
      },
    ]
  }

  handlePagesChanged(pagesChangedMsg: PagesChanged): StateUpdate {
    const { appPages } = pagesChangedMsg
    return [
      { appPages },
      () => {
        this.hostCommunicationMgr.sendMessageToHost({
          type: "SET_APP_PAGES",
          appPages,
        })
      },
    ]
  }

  handlePageNotFound(pageNotFound: PageNotFound): StateUpdate {
    const { pageName } = pageNotFound
    this.onPageNotFound(pageName)

    return [
      { currentPageScriptHash: this.mainScriptHash ?? "" },
      () => {
        this.hostCommunicationMgr.sendMessageToHost({
          type: "SET_CURRENT_PAGE_NAME",
          currentPageName: "",
          currentPageScriptHash: this.mainScriptHash ?? "",
        })
      },
    ]
  }

  findPageByUrlPath(pathname: string): IAppPage | null {
    return (
      this.appPages.find(appPage =>
        // The page name is embedded at the end of the URL path, and if not, we are in the main page.
        // See https://github.com/streamlit/streamlit/blob/1.19.0/frontend/src/App.tsx#L740
        pathname.endsWith("/" + appPage.urlPathname)
      ) ?? this.mainPage
    )
  }

  handlePageConfigChanged(pageConfig: PageConfig): void {
    this.isPageIconSet = Boolean(pageConfig.favicon)
    this.isPageTitleSet = Boolean(pageConfig.title)
  }

  clearPageElements(
    elements: AppRoot,
    mainScriptHash: string,
    sidebarElements: BlockNode | undefined
  ): AppRoot {
    if (this.isMPAv1) {
      return AppRoot.empty(
        mainScriptHash,
        false,
        sidebarElements,
        elements.logo
      )
    }

    return elements.filterMainScriptElements(mainScriptHash)
  }
}
