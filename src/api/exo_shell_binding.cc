// Copyright (c) 2014 Stanislas Polu.
// See the LICENSE file.

#include "src/api/exo_shell_binding.h"

#include "src/browser/exo_shell.h"

namespace exo_shell {

ExoShellBindingFactory::ExoShellBindingFactory()
{
}

ExoShellBindingFactory::~ExoShellBindingFactory()
{
}

ApiBinding* ExoShellBindingFactory::Create(
    const unsigned int id,
    scoped_ptr<base::DictionaryValue> args)
{
  return new ExoShellBinding(id, args.Pass());
}


ExoShellBinding::ExoShellBinding(
    const unsigned int id, 
    scoped_ptr<base::DictionaryValue> args)
  : ApiBinding("shell", id)
{

  std::string root_url = "http://google.com";
  args->GetString("root_url", &root_url);

  int width = 800;
  int height = 600;

  args->GetInteger("size.width", &width);
  args->GetInteger("size.height", &height);

  std::string title = "ExoShell";
  args->GetString("title", &title);

  std::string icon_path = "";
  args->GetString("icon_path", &icon_path);

  shell_.reset(ExoShell::CreateNew(
        GURL(root_url), 
        gfx::Size(width, height), 
        title, 
        icon_path, 
        true));
}

ExoShellBinding::~ExoShellBinding()
{
  LOG(INFO) << "ExoShellBinding Destructor";
  shell_.reset();
}


  void
ExoShellBinding::LocalCall(
    const std::string& method,
    scoped_ptr<base::DictionaryValue> args,
    const ApiHandler::ActionCallback& callback)
{
  base::DictionaryValue* res = new base::DictionaryValue;

  LOG(INFO) << "CALL " << method;
  if(method.compare("show") == 0) {
    shell_->Show();
  }
  if(method.compare("focus") == 0) {
    bool focus = true;
    args->GetBoolean("focus", &focus);
    shell_->Focus(focus);
  }
  else if(method.compare("maximize") == 0) {
    shell_->Maximize();
  }
  else if(method.compare("unmaximize") == 0) {
    shell_->UnMaximize();
  }
  else if(method.compare("minimize") == 0) {
    shell_->Minimize();
  }
  else if(method.compare("restore") == 0) {
    shell_->Restore();
  }
  else if(method.compare("set_title") == 0) {
    std::string title = "";
    args->GetString("title", &title);
    shell_->SetTitle(title);
  }
  else if(method.compare("close") == 0) {
    shell_->Close();
  }
  else if(method.compare("is_closed") == 0) {
    res->SetBoolean("is_closed", shell_->is_closed());
  }
  else if(method.compare("size") == 0) {
    res->SetInteger("size.width", shell_->size().width());
    res->SetInteger("size.height", shell_->size().height());
  }
  else if(method.compare("position") == 0) {
    res->SetInteger("position.x", shell_->position().x());
    res->SetInteger("position.y", shell_->position().y());
  }

  callback.Run(std::string(""), 
               scoped_ptr<base::Value>(res).Pass());
}


} // namespace exo_shell
