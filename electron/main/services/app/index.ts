import {inject, injectable} from "inversify"
import type { BrowserView } from "electron";
import {UniversalService} from "../universal";
import {useUniversalView} from "./composables/view";
import {DatabaseService} from "../database";
import {IApp} from "../../../../shared/models/app";

@injectable()
export class AppService {

    static key: symbol = Symbol.for(AppService.name)

    views: Record<string, BrowserView> = {}

    constructor(
        @inject(UniversalService.key) readonly mainService: UniversalService,
        @inject(DatabaseService.key) readonly databaseService: DatabaseService
    ) {}

    async upsertView(_id: string, auto?: boolean) {

        if(!this.mainService.win) {
            return
        }

        const shortcut: IApp = await this.getShortcut(_id)
        // Không có shortcut trong db
        if(!shortcut) {
            return
        }
        console.log(`Init App: ${shortcut.name} - ${auto ? 'auto' : 'manual'}`)

        /**
         * Đã tồn tại view này
         * Todo: Focus view
         */
        if (this.views[_id]) {
            return
        }

        const view = await useUniversalView(_id)
        // view.webContents.audioMuted = true

        await this.injectView(view, shortcut, auto)
    }

    async getShortcut(_id: string) {
        try {
          return this.databaseService.apps.findOneAsync({_id})
        } catch (e) {}
    }

    async injectView(view: BrowserView, shortcut: IApp, auto?: boolean) {
        if(!this.mainService.win) {
            return
        }

        this.mainService.win.addBrowserView(view)
        const [width, height] = this.mainService.win.getContentSize()

        view.setBounds({
            x: 75,
            y: 0,
            width: width - 75,
            height: height
        })
        view.setAutoResize({
            width: true,
            height: true,
        })

        await view.webContents.loadURL(shortcut.url)

        this.views[shortcut._id] = view
        await this.mainService.notifyToUniversalView('injected-universal-view', shortcut._id)
        console.log('Injected view:', shortcut.name)

        // view.webContents.openDevTools()

        if(auto) {
            this.mainService.insertToStackView('app-' + shortcut._id)
        }
        await this.mainService.focusLastView()
    }

    async togggleView(_id: string) {
        console.log('Toggle view:', _id)
        if(!this.mainService.win) {
            return
        }
        const view = this.views[_id]
        if(!view) {
            // Không có view này
            return
        }
        this.mainService.win.setTopBrowserView(view)
        this.mainService.insertToStackView('app-' + _id)
        await this.mainService.focusLastView()
    }

    /**
     * Tìm kiếm shortcut theo _id
     * Cập nhật muted
     * Gi trạng thái vào db
     */
    async toggleMuted(_id: string) {
        console.log('🥁 Toggle muted view:', _id)

        const view = this.views[_id]
        if(!view) {
            // Không exist trong views
            return
        }

        // toggle
        this.views[_id].webContents.audioMuted = !view.webContents.audioMuted

        // update db
        await this.databaseService.updateApp({_id}, { muted: !view.webContents.audioMuted })
    }

    async removeView(_id: string) {
        console.log('Remove view:', _id)
        const view = this.views[_id]
        if (!view) {
            // Không có view này
            return
        }
        this.mainService.win?.removeBrowserView(view)
        delete this.views[_id]
        this.mainService.insertToStackView('app-' + _id, true)

        await this.mainService.focusLastView()

    }

}
