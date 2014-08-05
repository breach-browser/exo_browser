// Copyright (c) 2014 Stanislas Polu.
// See the LICENSE file.

#ifndef EXO_SHELL_BROWSER_EXO_SHELL_H_
#define EXO_SHELL_BROWSER_EXO_SHELL_H_

#include <vector>

#include "base/basictypes.h"
#include "base/callback_forward.h"
#include "base/memory/scoped_ptr.h"
#include "base/strings/string_piece.h"
#include "ui/gfx/native_widget_types.h"
#include "ui/gfx/size.h"
#include "ui/gfx/point.h"
#include "ui/gfx/image/image.h"
#include "ui/views/widget/widget.h"
#include "content/public/browser/web_contents_delegate.h"
#include "content/public/browser/notification_observer.h"
#include "content/public/browser/web_contents_observer.h"
#include "content/public/browser/notification_registrar.h"
#include "vendor/brightray/browser/default_web_contents_delegate.h"
#include "vendor/brightray/browser/inspectable_web_contents_delegate.h"
#include "vendor/brightray/browser/inspectable_web_contents_impl.h"

#if defined(USE_AURA)
#include "ui/views/widget/widget_delegate.h"
#include "ui/views/widget/widget_observer.h"
#endif

#if defined(OS_MACOSX)
struct CGContext;
#endif

class GURL;

namespace base {
class CommandLine;
}

namespace content {
class WebContents;
struct NativeWebKeyboardEvent;
struct FileChooserParams;
}

namespace exo_shell {

class ExoShellDevToolsFrontend;
class ExoShellJavaScriptDialogManager;


// ### ExoShell
//
// This represents an ExoShell window. The ExoShell window opens on a
// root_url provided at creation. The window exposes only one webcontents
// with support for the <exoframe> tag.
//
// The ExoShell lives on the BrowserThread::UI thread
class ExoShell : public brightray::DefaultWebContentsDelegate,
                   public brightray::InspectableWebContentsDelegate,
                   public content::WebContentsObserver,
#if defined(USE_AURA)
                   public views::WidgetDelegateView,
                   public views::WidgetObserver,
#elif defined(OS_MACOSX)
#endif
                   public content::NotificationObserver {
public:

  /****************************************************************************/
  /* STATIC INTERFACE */
  /****************************************************************************/
  // ### CreateNew
  //
  // Creates a new ExoShell window with the specified `root_url`
  // ```
  // @root_url  {GURL} the main document root url
  // @size      {Size} the initial size of the window
  // @title     {string} the title to use
  // @icon_path {string} icon_path (no effect on OSX)
  // @has_frame {boolean} has a frame
  // ```
  static ExoShell* CreateNew(
      const GURL& root_url,
      const gfx::Size& size,
      const std::string& title,
      const std::string& icon_path,
      const bool has_frame);

  // ### CreateNew
  //
  // Creates a new ExoShell window out of an existing WebContents
  // ```
  // @web_contents {WebContents} the web_contents to use
  // @size         {Size} the initial size of the window
  // @icon_path    {string} icon_path (no effect on OSX)
  // ```
  static ExoShell* CreateNew(
      content::WebContents* web_contents,
      const gfx::Size& size,
      const std::string& title,
      const std::string& icon_path,
      const bool has_frame);

  // ### instances
  //
  // Getter for all the currently working ExoShell instances.
  static std::vector<ExoShell*>& instances() { return s_instances; }

  // ### CloseAll
  //
  // Closes all open ExoShell windows
  static void CloseAll();

  /****************************************************************************/
  /* PUBLIC INTERFACE */
  /****************************************************************************/
  // ### ~ExoShell
  ~ExoShell();

  // ### Show
  //
  // Initially show the window
  void Show() { PlatformShow(); }

  // ### Focus
  //
  // Focuses the ExoShell window
  void Focus(bool focus) { PlatformFocus(focus); }

  // ### Maximize
  //
  // Maximize the ExoShell window
  void Maximize() { PlatformMaximize(); }

  // ### UnMaximize
  //
  // UnMaximize the ExoShell window
  void UnMaximize() { PlatformUnMaximize(); }

  // ### Minimize
  //
  // Minimize the ExoShell window
  void Minimize() { PlatformMinimize(); }

  // ### Restore
  //
  // Restore the ExoShell window
  void Restore() { PlatformRestore(); }

  // ### SetTitle
  //
  // Sets the ExoShell window title
  void SetTitle(const std::string& title);


  // ### Close
  //
  // Closes the ExoShell window and reclaim underlying WebContents
  void Close();

  // ### Move
  //
  // Moves the ExoShell window and reclaim underlying WebContents
  void Move(int x, int y);


  // ### is_closed
  //
  // Returns whether the ExoShell is killed or not
  bool is_closed() { return is_closed_; }

  // ### WindowSize
  //
  // Retrieves the native Window size
  gfx::Size size() { return PlatformSize(); }

  // ### WindowPosition
  //
  // Retrieves the native Window position
  gfx::Point position() { return PlatformPosition(); }

  void move(int x, int y) { PlatformMove(x, y); }

  // ### web_contents
  //
  // Returns the underlying web_contents
  content::WebContents* web_contents() const;

  /****************************************************************************/
  /* WEBCONTENTSDELEGATE IMPLEMENTATION */
  /****************************************************************************/
  virtual content::WebContents* OpenURLFromTab(
      content::WebContents* source,
      const content::OpenURLParams& params) OVERRIDE;

  virtual void RequestToLockMouse(content::WebContents* web_contents,
                                  bool user_gesture,
                                  bool last_unlocked_by_target) OVERRIDE;
  virtual bool CanOverscrollContent() const OVERRIDE;

  virtual void CloseContents(content::WebContents* source) OVERRIDE;

  virtual content::JavaScriptDialogManager*
    GetJavaScriptDialogManager() OVERRIDE;

  virtual void ActivateContents(content::WebContents* contents) OVERRIDE;
  virtual void DeactivateContents(content::WebContents* contents) OVERRIDE;

  virtual void RendererUnresponsive(content::WebContents* source) OVERRIDE;
  virtual void RendererResponsive(content::WebContents* source) OVERRIDE;
  virtual void WorkerCrashed(content::WebContents* source) OVERRIDE;

  virtual void RunFileChooser(
      content::WebContents* web_contents,
      const content::FileChooserParams& params) OVERRIDE;
  virtual void EnumerateDirectory(content::WebContents* web_contents,
                                  int request_id,
                                  const base::FilePath& path) OVERRIDE;
  /****************************************************************************/
  /* WEBCONTENTSOBSERVER IMPLEMENTATION                                       */
  /****************************************************************************/
  virtual bool OnMessageReceived(const IPC::Message& message) OVERRIDE; 

  /****************************************************************************/
  /* NOTIFICATIONOBSERFVER IMPLEMENTATION */
  /****************************************************************************/
  virtual void Observe(int type,
                       const content::NotificationSource& source,
                       const content::NotificationDetails& details) OVERRIDE;
protected:

  // ### inspectable_web_contents
  //
  // Returns the underlying inspectable_web_contents
  brightray::InspectableWebContentsImpl* inspectable_web_contents() const {
    return static_cast<brightray::InspectableWebContentsImpl*>(
        inspectable_web_contents_.get());
  }

private:
  /****************************************************************************/
  /* PRIVATE INTERFACE */
  /****************************************************************************/
  explicit ExoShell(
      content::WebContents* web_contents,
      const gfx::Size& size,
      const std::string& title,
      const std::string& icon_path,
      const bool has_frame);

#if defined(USE_AURA)

  /****************************************************************************/
  /* VIEWS::WIDGETOBSERVER IMPLEMENTATION */
  /****************************************************************************/
  // views::WidgetObserver:
  virtual void OnWidgetActivationChanged(
      views::Widget* widget, bool active) OVERRIDE;

  /****************************************************************************/
  /* VIEWS::WIDGETDELEGATE IMPLEMENTATION */
  /****************************************************************************/
  virtual void DeleteDelegate() OVERRIDE;
  virtual views::View* GetInitiallyFocusedView() OVERRIDE;
  virtual bool CanResize() const OVERRIDE;
  virtual bool CanMaximize() const OVERRIDE;
  virtual base::string16 GetWindowTitle() const OVERRIDE;
  virtual bool ShouldHandleSystemCommands() const OVERRIDE;
  virtual gfx::ImageSkia GetWindowAppIcon() OVERRIDE;
  virtual gfx::ImageSkia GetWindowIcon() OVERRIDE;
  virtual views::Widget* GetWidget() OVERRIDE;
  virtual const views::Widget* GetWidget() const OVERRIDE;
  virtual views::View* GetContentsView() OVERRIDE;
  virtual bool ShouldDescendIntoChildForEventHandling(
     gfx::NativeView child,
     const gfx::Point& location) OVERRIDE;
  virtual views::ClientView* CreateClientView(views::Widget* widget) OVERRIDE;
  virtual views::NonClientFrameView* CreateNonClientFrameView(
      views::Widget* widget) OVERRIDE;

#elif defined(OS_MACOSX)
#endif

  /****************************************************************************/
  /* STATIC PLATFORM INTERFACE */
  /****************************************************************************/
  // All the methods that begin with Platform need to be implemented by the
  // platform specific Browser implementation.

  // ### PlatformInitialize
  //
  // Helper for one time initialization of application
  static void PlatformInitialize(const gfx::Size& default_window_size);


  /****************************************************************************/
  /* PLATFORM INTERFACE */
  /****************************************************************************/
  // ### PlatformCleanup
  //
  // Called from the destructor to let each platform do any necessary cleanup.
  void PlatformCleanUp();

  // ### PlatformCreateWindow
  //
  // Creates the ExoShell window GUI.
  void PlatformCreateWindow(const gfx::Size& size);

  // ### PlatformShow
  //
  // Initially Show the ExoShell window
  void PlatformShow();

  // ### PlatformFocus
  //
  // Focuses the ExoShell window
  void PlatformFocus(bool focus);

  // ### PlatformMaximize
  //
  // Maximizes the ExoShell window
  void PlatformMaximize();

  // ### PlatformUnMaximize
  //
  // Maximizes the ExoShell window
  void PlatformUnMaximize();

  // ### PlatformMinimize
  //
  // Minimize the ExoShell window
  void PlatformMinimize();

  // ### PlatformRestore
  //
  // Restore the ExoShell window
  void PlatformRestore();

  // ### PlatformSetTitle
  //
  // Set the title of ExoShell window.
  void PlatformSetTitle(const std::string& title);

  // ### PlatformClose
  //
  // Let each platform close the window.
  void PlatformClose();


  // ### PlatformSize
  //
  // Retrieves the size of the ExoShell window.
  gfx::Size PlatformSize();

  // ### PlatformPosition
  //
  // Retrieves the position of the ExoShell window.
  gfx::Point PlatformPosition();
  //
  // ### PlatformMove
  //
  // Retrieves the position of the ExoShell window.
  void PlatformMove(int x, int y);


  /****************************************************************************/
  /* MEMBERS */
  /****************************************************************************/
  scoped_ptr<ExoShellJavaScriptDialogManager> dialog_manager_;
  content::NotificationRegistrar                registrar_;

#if defined(USE_AURA)
  scoped_ptr<views::Widget>                     window_;
#elif defined(OS_MACOSX)
  gfx::NativeWindow                             window_;
#endif
  bool                                          is_closed_;
  gfx::Image                                    icon_;
  std::string                                   title_;
  bool                                          has_frame_;

  scoped_ptr<brightray::InspectableWebContents> inspectable_web_contents_;

  // A static container of all the open instances.
  static std::vector<ExoShell*>               s_instances;

  DISALLOW_COPY_AND_ASSIGN(ExoShell);
};

} // namespace exo_shell

#endif // EXO_SHELL_BROWSER_EXO_SHELL_H_
