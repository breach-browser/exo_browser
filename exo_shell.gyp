# Copyright (c) 2014 Stanislas Polu. All rights reserved.
# see LICENSE file

{
  'variables': {
    'project_name': 'exo_shell',
    'product_name': 'ExoShell',
    'app_sources': [
      'src/browser/resources/win/exo_shell.rc',
      'src/browser/resources/win/resource.h',
      'src/common/main.cc',
    ],
    'js_sources': [
      'src/renderer/extensions/resources/web_view.js',
    ],
    'lib_sources': [
      'src/common/main_delegate.cc',
      'src/common/main_delegate.h',
      'src/common/messages.cc',
      'src/common/messages.h',
      'src/common/switches.cc',
      'src/common/switches.h',
      'src/common/draggable_region.h',
      'src/common/draggable_region.cc',

      'src/browser/resources/linux/application_info_linux.cc',
      'src/browser/browser_client.cc',
      'src/browser/browser_client.h',
      'src/browser/browser_main_parts.cc',
      'src/browser/browser_main_parts.h',
      'src/browser/browser_main_parts_mac.mm',
      'src/browser/util/platform_util.h',
      'src/browser/util/platform_util_aura.cc',
      'src/browser/util/platform_util_linux.cc',
      'src/browser/util/platform_util_mac.mm',
      'src/browser/mac/application_mac.h',
      'src/browser/mac/application_mac.mm',
      'src/browser/resource_dispatcher_host_delegate.cc',
      'src/browser/resource_dispatcher_host_delegate.h',
      'src/browser/session/exo_session.h',
      'src/browser/session/exo_session.cc',
      'src/browser/session/exo_session_cookie_store.h',
      'src/browser/session/exo_session_cookie_store.cc',
      'src/browser/session/exo_session_visitedlink_store.h',
      'src/browser/session/exo_session_visitedlink_store.cc',
      'src/browser/exo_shell.h',
      'src/browser/exo_shell.cc',
      'src/browser/exo_shell_views.cc',
      'src/browser/exo_shell_mac.mm',
      'src/browser/dialog/javascript_dialog_manager.cc',
      'src/browser/dialog/javascript_dialog_manager.h',
      'src/browser/dialog/file_select_helper.h',
      'src/browser/dialog/file_select_helper.cc',
      'src/browser/dialog/download_manager_delegate.h',
      'src/browser/dialog/download_manager_delegate.cc',
      'src/browser/dialog/download_manager_delegate_gtk.cc',
      'src/browser/dialog/download_manager_delegate_mac.mm',
      'src/browser/ui/views/frameless_view.h',
      'src/browser/ui/views/frameless_view.cc',

      'src/renderer/renderer_client.cc',
      'src/renderer/renderer_client.h',
      'src/renderer/render_process_observer.cc',
      'src/renderer/render_process_observer.h',
      'src/renderer/render_view_observer.cc',
      'src/renderer/render_view_observer.h',

      'src/renderer/extensions/scoped_persistent.h',
      'src/renderer/extensions/unsafe_persistent.h',
      'src/renderer/extensions/static_v8_external_string_resource.h',
      'src/renderer/extensions/static_v8_external_string_resource.cc',
      'src/renderer/extensions/local_source_map.h',
      'src/renderer/extensions/local_source_map.cc',
      'src/renderer/extensions/native_handler.h',
      'src/renderer/extensions/native_handler.cc',
      'src/renderer/extensions/object_backed_native_handler.cc',
      'src/renderer/extensions/object_backed_native_handler.h',
      'src/renderer/extensions/document_custom_bindings.h',
      'src/renderer/extensions/document_custom_bindings.cc',
      'src/renderer/extensions/safe_builtins.h',
      'src/renderer/extensions/safe_builtins.cc',
      'src/renderer/extensions/console.h',
      'src/renderer/extensions/console.cc',
      'src/renderer/extensions/module_system.h',
      'src/renderer/extensions/module_system.cc',
      'src/renderer/extensions/context.h',
      'src/renderer/extensions/context.cc',
      'src/renderer/extensions/dispatcher.h',
      'src/renderer/extensions/dispatcher.cc',

      'src/geolocation/access_token_store.cc',
      'src/geolocation/access_token_store.h',

      'src/devtools/devtools_delegate.cc',
      'src/devtools/devtools_delegate.h',

      'src/net/net_log.cc',
      'src/net/net_log.h',
      'src/net/network_delegate.cc',
      'src/net/network_delegate.h',
      'src/net/url_request_context_getter.cc',
      'src/net/url_request_context_getter.h',

      'src/common/visitedlink/visitedlink_common.cc',
      'src/common/visitedlink/visitedlink_common.h',
      'src/common/visitedlink/visitedlink_message_generator.cc',
      'src/common/visitedlink/visitedlink_message_generator.h',
      'src/common/visitedlink/visitedlink_messages.h',
      'src/browser/visitedlink/visitedlink_delegate.h',
      'src/browser/visitedlink/visitedlink_event_listener.cc',
      'src/browser/visitedlink/visitedlink_event_listener.h',
      'src/browser/visitedlink/visitedlink_master.cc',
      'src/browser/visitedlink/visitedlink_master.h',
      'src/renderer/visitedlink/visitedlink_slave.cc',
      'src/renderer/visitedlink/visitedlink_slave.h',

      'src/api/api_handler.h',
      'src/api/api_handler.cc',
      'src/api/api_binding.h',
      'src/api/api_binding.cc',
      'src/api/exo_shell_binding.h',
      'src/api/exo_shell_binding.cc',
      'src/api/exo_session_binding.h',
      'src/api/exo_session_binding.cc',
    ],
    'framework_sources': [
      'src/common/library_main.cc',
      'src/common/library_main.h',
    ],
    'conditions': [
      ['OS=="win"', {
        'app_sources': [
          '<(libchromiumcontent_src_dir)/content/app/startup_helper_win.cc',
        ],
      }],
    ],
  },
  'includes': [
    'vendor/brightray/brightray.gypi',
  ],
  'targets': [
    {
      'target_name': '<(project_name)',
      'type': 'executable',
      'dependencies': [
        '<(project_name)_lib',
      ],
      'sources': [
        '<@(app_sources)',
      ],
      'conditions': [
        ['OS=="mac"', {
          'product_name': '<(product_name)',
          'mac_bundle': 1,
          'dependencies!': [
            '<(project_name)_lib',
          ],
          'dependencies': [
            '<(project_name)_framework',
            '<(project_name)_helper',
          ],
          'xcode_settings': {
            'INFOPLIST_FILE': 'src/browser/resources/mac/Info.plist',
            'LD_RUNPATH_SEARCH_PATHS': '@executable_path/../Frameworks',
          },
          'copies': [
            {
              'destination': '<(PRODUCT_DIR)/<(product_name).app/Contents/Frameworks',
              'files': [
                '<(PRODUCT_DIR)/<(product_name) Helper.app',
                '<(PRODUCT_DIR)/<(product_name).framework',
              ],
            },
          ],
          'postbuilds': [
            {
              # This postbuid step is responsible for creating the following
              # helpers:
              #
              # <(product_name) EH.app and <(product_name) NP.app are created
              # from <(product_name).app.
              #
              # The EH helper is marked for an executable heap. The NP helper
              # is marked for no PIE (ASLR).
              'postbuild_name': 'Make More Helpers',
              'action': [
                'vendor/brightray/tools/mac/make_more_helpers.sh',
                'Frameworks',
                '<(product_name)',
              ],
            },
          ]
        }],
        ['OS=="win"', {
          'copies': [
            {
              'destination': '<(PRODUCT_DIR)',
              'files': [
                '<(libchromiumcontent_library_dir)/chromiumcontent.dll',
                '<(libchromiumcontent_library_dir)/ffmpegsumo.dll',
                '<(libchromiumcontent_library_dir)/libEGL.dll',
                '<(libchromiumcontent_library_dir)/libGLESv2.dll',
                '<(libchromiumcontent_resources_dir)/icudtl.dat',
                '<(libchromiumcontent_resources_dir)/content_shell.pak',
                '<(libchromiumcontent_resources_dir)/ui_resources_200_percent.pak',
                '<(libchromiumcontent_resources_dir)/webkit_resources_200_percent.pak',
              ],
            },
          ],
        }],
        ['OS=="linux"', {
          'link_settings': {
            'libraries': [
              '-lpthread -ldl -lm -lX11 -lXrandr -lXext -lgconf-2',
            ],
          },
          'copies': [
            {
              'destination': '<(PRODUCT_DIR)',
              'files': [
                '<(libchromiumcontent_library_dir)/libchromiumcontent.so',
                '<(libchromiumcontent_library_dir)/libffmpegsumo.so',
                '<(libchromiumcontent_resources_dir)/icudtl.dat',
                '<(libchromiumcontent_resources_dir)/content_shell.pak',
              ],
            },
          ],
        }],
      ],
    },
    {
      'target_name': '<(project_name)_lib',
      'type': 'static_library',
      'dependencies': [
        '<(project_name)_js',
        'vendor/brightray/brightray.gyp:brightray',
      ],
      'sources': [
        '<@(lib_sources)',
      ],
      'include_dirs': [
        '.',
      ],
      'direct_dependent_settings': {
        'include_dirs': [
          '.',
        ],
      },
      'export_dependent_settings': [
        'vendor/brightray/brightray.gyp:brightray',
      ],
      'conditions': [
        ['OS!="linux"', {
          'sources/': [
            ['exclude', '/linux/'],
            ['exclude', '_linux\.(cc|h)$'],
          ],
        }],
        ['OS!="mac"', {
          'sources/': [
            ['exclude', '/mac/'],
            ['exclude', '_mac\.(mm|h)$'],
          ],
        },{
          'sources/': [
            ['exclude', '/views/'],
            ['exclude', '_views\.(cc|h)$'],
          ],
        }],
        ['OS!="win"', {
          'sources/': [
            ['exclude', '/win/'],
            ['exclude', '_win\.(cc|h)$'],
          ],
        }],
      ],
    },
    {
      'target_name': '<(project_name)_js',
      'type': 'none',
      'actions': [
        {
          'inputs': [
            'src/renderer/extensions/resources/web_view.js',
          ],
          'outputs': [
            'src/renderer/extensions/resources/web_view.js.bin',
          ],
          'action_name': 'xxd web_view.js',
          'action': ['xxd', '-i', 
          'src/renderer/extensions/resources/web_view.js',
          'src/renderer/extensions/resources/web_view.js.bin'],
        },
      ],
    },
  ],
  'conditions': [
    ['OS=="mac"', {
      'targets': [
        {
          'target_name': '<(project_name)_framework',
          'product_name': '<(product_name)',
          'type': 'shared_library',
          'dependencies': [
            '<(project_name)_lib',
          ],
          'sources': [
            '<@(framework_sources)',
          ],
          'mac_bundle': 1,
          'mac_bundle_resources': [
            '<(libchromiumcontent_resources_dir)/content_shell.pak',
            '<(libchromiumcontent_resources_dir)/icudtl.dat',
          ],
          'xcode_settings': {
            'LIBRARY_SEARCH_PATHS': '<(libchromiumcontent_library_dir)',
            'LD_DYLIB_INSTALL_NAME': '@rpath/<(product_name).framework/<(product_name)',
            'LD_RUNPATH_SEARCH_PATHS': '@loader_path/Libraries',
            'OTHER_LDFLAGS': [
              '-ObjC',
            ],
          },
          'copies': [
            {
              'destination': '<(PRODUCT_DIR)/<(product_name).framework/Versions/A/Libraries',
              'files': [
                '<(libchromiumcontent_library_dir)/ffmpegsumo.so',
                '<(libchromiumcontent_library_dir)/libchromiumcontent.dylib',
              ],
            },
          ],
          'postbuilds': [
            {
              'postbuild_name': 'Add symlinks for framework subdirectories',
              'action': [
                'tools/mac/create-framework-subdir-symlinks.sh',
                '<(product_name)',
                'Libraries',
                'Frameworks',
              ],
            },
          ],
          'export_dependent_settings': [
            '<(project_name)_lib',
          ],
        },
        {
          'target_name': '<(project_name)_helper',
          'product_name': '<(product_name) Helper',
          'type': 'executable',
          'dependencies': [
            '<(project_name)_framework',
          ],
          'sources': [
            '<@(app_sources)',
          ],
          'mac_bundle': 1,
          'xcode_settings': {
            'INFOPLIST_FILE': 'src/renderer/resources/mac/Info.plist',
            'LD_RUNPATH_SEARCH_PATHS': '@executable_path/../../../../Frameworks',
          },
        },
      ],
    }],
  ],
}
