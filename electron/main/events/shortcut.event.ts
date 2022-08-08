import {ICreateShortcut, IApp} from "@shared/interface/shortcut"
import {useAppService, useDatabase, useMainService} from "../composables";
import {Menu} from 'electron'
import type { MenuItem, MenuItemConstructorOptions } from 'electron'
import {fireNotify} from "./notify.event";

export const createShortcutHandle = async (shortcut: ICreateShortcut) => {
    console.log("Creating shortcut...", shortcut.name)
    const db = useDatabase()
    const mainService = useMainService()
    try {
        const _shortcut = await db.apps.insertAsync({
            ...shortcut,
            isCustom: false
        })
        mainService.notifyToBaseView("after-shortcut-created", _shortcut)

        // Gửi thông báo
        fireNotify("Thành công", `Đã tạo shortcut ${_shortcut.name}`)

    } catch (e) {
        console.log('Error creating shortcut', e)
    }
}

export const getShortcutsHandle = async () => {
    try {
        const dbs = useDatabase()
        return await dbs.apps.findAsync({})
            .sort({order: 1})
    } catch (e) {
        console.log('Error getting shortcuts', e)
    }
}

export const removeShortcutsHandle = async (id: string) => {
    try {
        const dbs = useDatabase()
        const mainService = useMainService()

        const shortcut: IApp = await dbs.apps.findOneAsync({_id: id})
        if(!shortcut) {
            // Không có shortcut này
            return
        }

        console.log("🔥Removing shortcut: ", shortcut.name)

        await dbs.apps.removeAsync({ _id: shortcut._id }, { multi: false })
        mainService.notifyToBaseView("after-shortcut-removed", shortcut._id)

        fireNotify("Thành công", `Đã xóa shortcut ${shortcut.name}`)

    } catch (e) {
        console.log('Error getting shortcuts', e)
    }
}



export const toggleBaseView = async () => {
    const mainService = useMainService()
    await mainService.toggleUniversalView()
}

export const openShortcutContextHanle = async (_id: string) => {

    console.log('✅ Context menu for:', _id)

    const universalService = useAppService()
    const dbServices = useDatabase()

    const shortcut: IApp = await dbServices.apps.findOneAsync({ _id })
    if(!shortcut) {
        // Không có shortcut này
        return
    }

    /**
     * Xoá shortcut ra khỏi db
     * Remove khỏi stack views
     * Thông báo xoá thành công
     * Todo: Update UI
     */
    const clickDeleteHandle = async () => {
        await removeShortcutsHandle(_id)
        await universalService.removeView(_id)
    }

    const clickToggleMuted = async () => {
        await universalService.toggleMutedView(_id)
    }

    const menus: Array<(MenuItemConstructorOptions) | (MenuItem)> = [
        {
            label: shortcut.muted ? 'Bật tiếng' : 'Tắt tiếng',
            click: clickToggleMuted
        },
        {
            label: 'Xoá tài khoản',
            click: clickDeleteHandle
        }
    ]

    const ctxMenu = Menu.buildFromTemplate(menus)

    ctxMenu.popup()
}

export const openSpotlightHandle = async () => {
    const mainService = useMainService()
    await mainService.openSpotlight()
}
