import tempfile
import time
import os
import sys
from playwright.sync_api import sync_playwright

def capture(stage="before"):
    ext_path = os.path.abspath('.output/chrome-mv3')
    out_dir = os.path.abspath(f'screenshots/{stage}')
    os.makedirs(out_dir, exist_ok=True)

    with tempfile.TemporaryDirectory() as user_data_dir:
        with sync_playwright() as p:
            context = p.chromium.launch_persistent_context(
                user_data_dir,
                headless=False,
                args=[
                    f'--disable-extensions-except={ext_path}',
                    f'--load-extension={ext_path}',
                ],
                viewport={'width': 1440, 'height': 900}
            )
            time.sleep(1)
            ext_id = None
            for sw in context.service_workers:
                if 'chrome-extension://' in sw.url:
                    ext_id = sw.url.split('/')[2]
                    break
            print('Extension ID:', ext_id)
            if not ext_id:
                print('Could not find extension ID!')
                context.close()
                return

            page = context.new_page()
            page.goto(f'chrome-extension://{ext_id}/newtab.html')
            page.wait_for_load_state('networkidle')
            time.sleep(1.5)

            # 1. Onboarding tour
            page.screenshot(path=os.path.join(out_dir, '01_onboarding_tour.png'))
            print('Saved 01_onboarding_tour')

            # Click 'Skip & Start Creating'
            skip_btn = page.locator('text=Skip & Start Creating')
            if skip_btn.is_visible():
                skip_btn.click()
                time.sleep(1)

            # 2. Wallpaper mode
            page.screenshot(path=os.path.join(out_dir, '02_wallpaper_mode.png'))
            print('Saved 02_wallpaper_mode')

            # 3. Presets gallery
            presets_btn = page.locator('button[title*="Presets"]')
            if presets_btn.is_visible():
                presets_btn.click()
                time.sleep(0.5)
                page.screenshot(path=os.path.join(out_dir, '03_preset_gallery.png'))
                print('Saved 03_preset_gallery')
                page.keyboard.press('Escape')
                time.sleep(0.5)

            # 4. Shortcuts dialog
            shortcuts_btn = page.locator('button[title*="Shortcuts"]')
            if shortcuts_btn.is_visible():
                shortcuts_btn.click()
                time.sleep(0.5)
                page.screenshot(path=os.path.join(out_dir, '04_shortcuts_dialog.png'))
                print('Saved 04_shortcuts_dialog')
                page.keyboard.press('Escape')
                time.sleep(0.5)

            # 5. Settings dialog
            settings_btn = page.locator('button[title*="Settings"]')
            if settings_btn.is_visible():
                settings_btn.click()
                time.sleep(0.5)
                page.screenshot(path=os.path.join(out_dir, '05_settings_dialog.png'))
                print('Saved 05_settings_dialog')

                # 6. Privacy policy
                priv_link = page.locator('button:has-text("Privacy Policy"), a:has-text("Privacy Policy")')
                if priv_link.is_visible():
                    priv_link.click()
                    time.sleep(0.5)
                    page.screenshot(path=os.path.join(out_dir, '06_privacy_policy.png'))
                    print('Saved 06_privacy_policy')
                    page.keyboard.press('Escape')
                    time.sleep(0.3)

                page.keyboard.press('Escape')
                time.sleep(0.5)

            # 7. Widget Layout Overlay
            layout_btn = page.locator('button[title*="Widget Layout"]')
            if layout_btn.is_visible():
                layout_btn.click()
                time.sleep(0.5)
                page.screenshot(path=os.path.join(out_dir, '07_widget_layout_overlay.png'))
                print('Saved 07_widget_layout_overlay')

                # 8. Widget Config Drawer
                drawer_btn = page.locator('button[title*="Toggle widgets"]')
                if drawer_btn.is_visible():
                    drawer_btn.click()
                    time.sleep(0.5)
                    page.screenshot(path=os.path.join(out_dir, '08_widget_config_drawer.png'))
                    print('Saved 08_widget_config_drawer')
                    page.keyboard.press('Escape')
                    time.sleep(0.3)

                # Exit layout mode
                done_btn = page.locator('button[title*="Save layout"]')
                if done_btn.is_visible():
                    done_btn.click()
                else:
                    page.keyboard.press('Escape')
                time.sleep(0.5)

            # 9. Enter Drawing Mode
            draw_btn = page.locator('button[title*="Customize Wallpaper"]')
            if draw_btn.is_visible():
                draw_btn.click()
                time.sleep(0.5)

            page.screenshot(path=os.path.join(out_dir, '09_drawing_mode.png'))
            print('Saved 09_drawing_mode')

            # 10. Select element on canvas
            page.keyboard.press('Control+a')
            time.sleep(0.5)
            page.screenshot(path=os.path.join(out_dir, '10_drawing_mode_element_selected.png'))
            print('Saved 10_drawing_mode_element_selected')

            # 11. Style panel element tab
            page.screenshot(path=os.path.join(out_dir, '11_style_panel_element.png'))
            print('Saved 11_style_panel_element')

            # 12. Style panel wallpaper tab
            wall_tab = page.get_by_role("button", name="Wallpaper", exact=True)
            if wall_tab.is_visible():
                wall_tab.click()
                time.sleep(0.5)
                page.screenshot(path=os.path.join(out_dir, '12_style_panel_wallpaper.png'))
                print('Saved 12_style_panel_wallpaper')

            # 13. Scene switcher dropdown
            scene_btn = page.locator('button[title*="Switch Wallpaper Scene"]').first
            if scene_btn.is_visible():
                scene_btn.click()
                time.sleep(0.5)
                page.screenshot(path=os.path.join(out_dir, '13_scene_switcher.png'))
                print('Saved 13_scene_switcher')
                page.keyboard.press('Escape')
                time.sleep(0.3)

            # 14. Export menu dropdown
            export_btn = page.locator('button[title*="Export"]')
            if export_btn.is_visible():
                export_btn.click()
                time.sleep(0.5)
                page.screenshot(path=os.path.join(out_dir, '14_export_menu.png'))
                print('Saved 14_export_menu')

            context.close()
            print(f'All {stage} screenshots captured successfully!')

if __name__ == '__main__':
    stage = sys.argv[1] if len(sys.argv) > 1 else "before"
    capture(stage)
