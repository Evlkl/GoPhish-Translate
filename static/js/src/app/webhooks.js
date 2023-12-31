let webhooks = [];

const dismiss = () => {
    $("#name").val("");
    $("#url").val("");
    $("#secret").val("");
    $("#is_active").prop("checked", false);
    $("#flashes").empty();
};

const saveWebhook = (id) => {
    let wh = {
        name: $("#name").val(),
        url: $("#url").val(),
        secret: $("#secret").val(),
        is_active: $("#is_active").is(":checked"),
    };
    if (id != -1) {
        wh.id = parseInt(id);
        api.webhookId.put(wh)
            .success(function(data) {
                dismiss();
                load();
                $("#modal").modal("hide");
                successFlash(`Webhook "${escapeHtml(wh.name)}" uğurla yeniləndi!`);
            })
            .error(function(data) {
                modalError(data.responseJSON.message)
            })
    } else {
        api.webhooks.post(wh)
            .success(function(data) {
                load();
                dismiss();
                $("#modal").modal("hide");
                successFlash(`Webhook "${escapeHtml(wh.name)}" uğurla yaradıldı!`);
            })
            .error(function(data) {
                modalError(data.responseJSON.message)
            })
    }
};

const load = () => {
    $("#webhookTable").hide();
    $("#loading").show();
    api.webhooks.get()
        .success((whs) => {
            webhooks = whs;
            $("#loading").hide()
            $("#webhookTable").show()
            let webhookTable = $("#webhookTable").DataTable({
                destroy: true,
                columnDefs: [{
                    orderable: false,
                    targets: "no-sort"
                }]
            });
            webhookTable.clear();
            $.each(webhooks, (i, webhook) => {
                webhookTable.row.add([
                    escapeHtml(webhook.name),
                    escapeHtml(webhook.url),
                    escapeHtml(webhook.is_active),
                    `
                      <div class="pull-right">
                        <button class="btn btn-primary ping_button" data-webhook-id="${webhook.id}">
                          Ping
                        </button>
                        <button class="btn btn-primary edit_button" data-toggle="modal" data-backdrop="static" data-target="#modal" data-webhook-id="${webhook.id}">
                          <i class="fa fa-pencil"></i>
                        </button>
                        <button class="btn btn-danger delete_button" data-webhook-id="${webhook.id}">
                          <i class="fa fa-trash-o"></i>
                        </button>
                      </div>
                    `
                ]).draw()
            })
        })
        .error(() => {
            errorFlash("Webhookları əldə edərkən xəta baş verdi")
        })
};

const editWebhook = (id) => {
    $("#modalSubmit").unbind("click").click(() => {
        saveWebhook(id);
    });
    if (id !== -1) {
        $("#webhookModalLabel").text("Webhooku Redaktə Et")
        api.webhookId.get(id)
          .success(function(wh) {
              $("#name").val(wh.name);
              $("#url").val(wh.url);
              $("#secret").val(wh.secret);
              $("#is_active").prop("checked", wh.is_active);
          })
          .error(function () {
              errorFlash("Webhookları əldə edərkən xəta baş verdi")
          });
    } else {
        $("#webhookModalLabel").text("Yeni Webhook")
    }
};

const deleteWebhook = (id) => {
    var wh = webhooks.find(x => x.id == id);
    if (!wh) {
        return;
    }
    Swal.fire({
        title: "Əminsiniz?",
        text: `Bu webhooku siləcək '${escapeHtml(wh.name)}'`,
        type: "warning",
        animation: false,
        showCancelButton: true,
        confirmButtonText: "Sil",
        confirmButtonColor: "#428bca",
        reverseButtons: true,
        allowOutsideClick: false,
        preConfirm: function () {
            return new Promise((resolve, reject) => {
                api.webhookId.delete(id)
                    .success((msg) => {
                        resolve()
                    })
                    .error((data) => {
                        reject(data.responseJSON.message)
                    })
            })
            .catch(error => {
                Swal.showValidationMessage(error)
              })
        }
    }).then(function(result) {
        if (result.value) {
            Swal.fire(
                "Webhook Silindi!",
                `Bu webhook silinib!`,
                "success"
            );
        }
        $("button:contains('Bəli')").on("click", function() {
            location.reload();
        })
    })
};

const pingUrl = (btn, whId) => {
    dismiss();
    btn.disabled = true;
    api.webhookId.ping(whId)
        .success(function(wh) {
            btn.disabled = false;
            successFlash(`Ping uğurla göndərildi "${escapeHtml(wh.name)}".`);
        })
        .error(function(data) {
            btn.disabled = false;
            var wh = webhooks.find(x => x.id == whId);
            if (!wh) {
                return
            }
            errorFlash(`"${escapeHtml(wh.name)}" Ping göndərilə bilmədi : "${escapeHtml(data.responseJSON.message)}"`)
        });
};

$(document).ready(function() {
    load();
    $("#modal").on("hide.bs.modal", function() {
        dismiss();
    });
    $("#new_button").on("click", function() {
        editWebhook(-1);
    });
    $("#webhookTable").on("click", ".edit_button", function(e) {
        editWebhook($(this).attr("data-webhook-id"));
    });
    $("#webhookTable").on("click", ".delete_button", function(e) {
        deleteWebhook($(this).attr("data-webhook-id"));
    });
    $("#webhookTable").on("click", ".ping_button", function(e) {
        pingUrl(e.currentTarget, e.currentTarget.dataset.webhookId);
    });
});
