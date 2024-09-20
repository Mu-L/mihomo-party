import React, { useEffect, useState } from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Button, Input, Select, SelectItem, Switch, Tab, Tabs, Tooltip } from '@nextui-org/react'
import { BiCopy, BiSolidFileImport } from 'react-icons/bi'
import useSWR from 'swr'
import {
  checkAutoRun,
  copyEnv,
  disableAutoRun,
  enableAutoRun,
  fetchThemes,
  getFilePath,
  importThemes,
  relaunchApp,
  resolveThemes,
  restartCore
} from '@renderer/utils/ipc'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { platform } from '@renderer/utils/init'
import { useTheme } from 'next-themes'
import { IoIosHelpCircle, IoMdCloudDownload } from 'react-icons/io'

const GeneralConfig: React.FC = () => {
  const { data: enable, mutate: mutateEnable } = useSWR('checkAutoRun', checkAutoRun)
  const { appConfig, patchAppConfig } = useAppConfig()
  const [customThemes, setCustomThemes] = React.useState([
    { key: 'default.css', label: '默认', content: '' }
  ])
  const [fetching, setFetching] = useState(false)
  const { setTheme } = useTheme()
  const {
    silentStart = false,
    useDockIcon = true,
    showTraffic = true,
    proxyInTray = true,
    useWindowFrame = false,
    autoQuitWithoutCore = false,
    autoQuitWithoutCoreDelay = 60,
    customTheme = 'default.css',
    envType = [platform === 'win32' ? 'powershell' : 'bash'],
    autoCheckUpdate,
    appTheme = 'system'
  } = appConfig || {}

  useEffect(() => {
    resolveThemes().then((themes) => {
      setCustomThemes(themes)
    })
  })

  return (
    <>
      <SettingCard>
        <SettingItem title="开机自启" divider>
          <Switch
            size="sm"
            isSelected={enable}
            onValueChange={async (v) => {
              try {
                if (v) {
                  await enableAutoRun()
                } else {
                  await disableAutoRun()
                }
              } catch (e) {
                alert(e)
              } finally {
                mutateEnable()
              }
            }}
          />
        </SettingItem>
        <SettingItem title="自动检查更新" divider>
          <Switch
            size="sm"
            isSelected={autoCheckUpdate}
            onValueChange={(v) => {
              patchAppConfig({ autoCheckUpdate: v })
            }}
          />
        </SettingItem>
        <SettingItem title="静默启动" divider>
          <Switch
            size="sm"
            isSelected={silentStart}
            onValueChange={(v) => {
              patchAppConfig({ silentStart: v })
            }}
          />
        </SettingItem>
        <SettingItem
          title="自动开启轻量模式"
          actions={
            <Tooltip content="关闭窗口指定时间后自动进入轻量模式">
              <Button isIconOnly size="sm" variant="light">
                <IoIosHelpCircle className="text-lg" />
              </Button>
            </Tooltip>
          }
          divider
        >
          <Switch
            size="sm"
            isSelected={autoQuitWithoutCore}
            onValueChange={(v) => {
              patchAppConfig({ autoQuitWithoutCore: v })
            }}
          />
        </SettingItem>
        {autoQuitWithoutCore && (
          <SettingItem title="自动开启轻量模式延时" divider>
            <Input
              size="sm"
              className="w-[100px]"
              type="number"
              endContent="秒"
              value={autoQuitWithoutCoreDelay.toString()}
              onValueChange={async (v: string) => {
                let num = parseInt(v)
                if (isNaN(num)) num = 5
                if (num < 5) num = 5
                await patchAppConfig({ autoQuitWithoutCoreDelay: num })
              }}
            />
          </SettingItem>
        )}
        <SettingItem
          title="复制环境变量类型"
          actions={envType.map((type) => (
            <Button
              key={type}
              title={type}
              isIconOnly
              size="sm"
              className="ml-2"
              variant="light"
              onPress={() => copyEnv(type)}
            >
              <BiCopy className="text-lg" />
            </Button>
          ))}
          divider
        >
          <Select
            className="w-[150px]"
            size="sm"
            selectionMode="multiple"
            selectedKeys={new Set(envType)}
            onSelectionChange={async (v) => {
              try {
                await patchAppConfig({
                  envType: Array.from(v) as ('bash' | 'cmd' | 'powershell')[]
                })
              } catch (e) {
                alert(e)
              }
            }}
          >
            <SelectItem key="bash">Bash</SelectItem>
            <SelectItem key="cmd">CMD</SelectItem>
            <SelectItem key="powershell">PowerShell</SelectItem>
          </Select>
        </SettingItem>
        {platform !== 'linux' && (
          <SettingItem title="托盘菜单显示节点信息" divider>
            <Switch
              size="sm"
              isSelected={proxyInTray}
              onValueChange={async (v) => {
                await patchAppConfig({ proxyInTray: v })
              }}
            />
          </SettingItem>
        )}
        {platform === 'darwin' && (
          <>
            <SettingItem title="显示 Dock 图标" divider>
              <Switch
                size="sm"
                isSelected={useDockIcon}
                onValueChange={async (v) => {
                  await patchAppConfig({ useDockIcon: v })
                }}
              />
            </SettingItem>
            <SettingItem title="显示网速信息" divider>
              <Switch
                size="sm"
                isSelected={showTraffic}
                onValueChange={async (v) => {
                  await patchAppConfig({ showTraffic: v })
                  await restartCore()
                }}
              />
            </SettingItem>
          </>
        )}

        <SettingItem title="使用系统标题栏" divider>
          <Switch
            size="sm"
            isSelected={useWindowFrame}
            onValueChange={async (v) => {
              await patchAppConfig({ useWindowFrame: v })
              await relaunchApp()
            }}
          />
        </SettingItem>
        <SettingItem title="背景色" divider>
          <Tabs
            size="sm"
            color="primary"
            selectedKey={appTheme}
            onSelectionChange={(key) => {
              setTheme(key.toString())
              patchAppConfig({ appTheme: key as AppTheme })
            }}
          >
            <Tab key="system" title="自动" />
            <Tab key="dark" title="深色" />
            <Tab key="light" title="浅色" />
          </Tabs>
        </SettingItem>
        <SettingItem
          title="主题"
          actions={
            <>
              <Button
                size="sm"
                isLoading={fetching}
                isIconOnly
                title="拉取主题"
                variant="light"
                className="ml-2"
                onPress={async () => {
                  setFetching(true)
                  try {
                    await fetchThemes()
                    setCustomThemes(await resolveThemes())
                  } catch (e) {
                    alert(e)
                  } finally {
                    setFetching(false)
                  }
                }}
              >
                <IoMdCloudDownload className="text-lg" />
              </Button>
              <Button
                size="sm"
                isIconOnly
                title="导入主题"
                variant="light"
                className="ml-2"
                onPress={async () => {
                  const files = await getFilePath(['css'])
                  if (!files) return
                  try {
                    await importThemes(files)
                    setCustomThemes(await resolveThemes())
                  } catch (e) {
                    alert(e)
                  }
                }}
              >
                <BiSolidFileImport className="text-lg" />
              </Button>
            </>
          }
        >
          <Select
            className="w-[60%]"
            size="sm"
            selectedKeys={new Set([customTheme])}
            onSelectionChange={async (v) => {
              try {
                await patchAppConfig({ customTheme: v.currentKey as string })
              } catch (e) {
                alert(e)
              }
            }}
          >
            {customThemes.map((theme) => (
              <SelectItem key={theme.key}>{theme.label}</SelectItem>
            ))}
          </Select>
        </SettingItem>
      </SettingCard>
    </>
  )
}

export default GeneralConfig
