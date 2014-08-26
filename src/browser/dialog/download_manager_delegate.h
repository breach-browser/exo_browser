// Copyright (c) 2014 Stanislas Polu.
// Copyright (c) 2012 The Chromium Authors.
// See the LICENSE file.

#ifndef EXO_SHELL_BROWSER_DOWNLOAD_MANAGER_DELEGATE_H_
#define EXO_SHELL_BROWSER_DOWNLOAD_MANAGER_DELEGATE_H_

#include "base/compiler_specific.h"
#include "base/memory/ref_counted.h"
#include "base/memory/weak_ptr.h"
#include "content/public/browser/download_manager_delegate.h"

namespace content {
class DownloadManager;
}

namespace exo_shell {

class ExoShellDownloadManagerDelegate
    : public content::DownloadManagerDelegate {
 public:
  ExoShellDownloadManagerDelegate();
  virtual ~ExoShellDownloadManagerDelegate();

  void SetDownloadManager(content::DownloadManager* manager);

  virtual void Shutdown() OVERRIDE;
  virtual bool DetermineDownloadTarget(
      content::DownloadItem* download,
      const content::DownloadTargetCallback& callback) OVERRIDE;
  virtual bool ShouldOpenDownload(
      content::DownloadItem* item,
      const content::DownloadOpenDelayedCallback& callback) OVERRIDE;
  virtual void GetNextId(const content::DownloadIdCallback& callback) OVERRIDE;

 private:
  typedef base::Callback<void(const base::FilePath&)>
      FilenameDeterminedCallback;

  static void GenerateFilename(const GURL& url,
                               const std::string& content_disposition,
                               const std::string& suggested_filename,
                               const std::string& mime_type,
                               const base::FilePath& suggested_directory,
                               const FilenameDeterminedCallback& callback);
  void OnDownloadPathGenerated(uint32 download_id,
                               const content::DownloadTargetCallback& callback,
                               const base::FilePath& suggested_path);
  void ChooseDownloadPath(uint32 download_id,
                          const content::DownloadTargetCallback& callback,
                          const base::FilePath& suggested_path);

  content::DownloadManager*                               download_manager_;
  base::FilePath                                          default_download_path_;
  bool                                                    suppress_prompting_;
  base::WeakPtrFactory<ExoShellDownloadManagerDelegate> weak_ptr_factory_; 

  friend class base::RefCountedThreadSafe<ExoShellDownloadManagerDelegate>;

  DISALLOW_COPY_AND_ASSIGN(ExoShellDownloadManagerDelegate);
};

} // namespace exo_shell

#endif // EXO_SHELL_BROWSER_DOWNLOAD_MANAGER_DELEGATE_H_
