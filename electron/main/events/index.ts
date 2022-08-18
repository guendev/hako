import {ipcMain, Notification} from "electron";
import {useMainServie, useUserServie} from "../composables/instance"
import {appEventsRegister} from "./app.event";
import {userEventsRegister} from "./user.event";

export const eventsRegister = () => {

    // Sự kiện hệ thống
    ipcMain.once('app:mounted', async () => {
        console.log('app:mounted')
        const mainService = useMainServie()
        const userService = useUserServie()
        if(!userService.user?.lazyApp) {
            await mainService.initApps()
        }
    })

    /**
     * Notify
     */
    ipcMain.handle('push-notify', (_, title: string, body: string) => {
        console.log('🔥', title, body)
        new Notification({ title, body }).show()
    })

    ipcMain.handle('push-route', async (_, route: string) => {
        const mainService = useMainServie()
        await mainService.pushRoute(route)
    })


    /**
     * App
     */
    appEventsRegister()

    userEventsRegister()

}
