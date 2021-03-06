/**
 * A Ext.grid.Panel specialisation for rendering the logs (if any)
 * for a particular job.
 *
 */
Ext.define('vegl.widgets.JobLogsPanel', {
    extend : 'portal.widgets.tab.ActivePreRenderTabPanel',
    alias : 'widget.joblogspanel',

    currentJob : null,

    constructor : function(config) {

        Ext.apply(config, {
            autoScroll : true,
            items : [],
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'bottom',
                items: [{
                    xtype: 'tbfill'
                },{
                    xtype: 'button',
                    text: 'Refresh',
                    iconCls: 'refresh-icon',
                    scope: this,
                    handler: function() {
                        if (this.currentJob) {
                            this.listLogsForJob(this.currentJob);
                        }
                    }
                }]
            }]
        });

        this.callParent(arguments);

        this.clearLogs(true);
    },

    /**
     * Reloads this store with all the jobs for the specified series
     */
    listLogsForJob : function(job) {
        var loadMaskElement = null;
        if (this.rendered) {
            loadMaskElement = this.getEl();
            loadMaskElement.mask('Loading logs...');
        }


        this.clearLogs();
        this.currentJob = job;

        Ext.Ajax.request({
            url : 'secure/getSectionedLogs.do',
            params : {
                jobId : job.get('id')
            },
            scope : this,
            callback : function(options, success, response) {
                if (loadMaskElement) {
                    loadMaskElement.unmask();
                }

                if (!success) {
                    this.addEmptyTab('Error communicating with the server.');
                    return;
                }

                var responseObj = Ext.JSON.decode(response.responseText);
                if (!responseObj || !responseObj.success) {
                    this.addEmptyTab('Couldn\'t find any logs for the selected job: ' + responseObj.msg);
                    return;
                }

                var sections = responseObj.data[0];
                var components = [];

                for (var sectionName in sections) {
                    components.push({
                        title : sectionName,
                        itemId : sectionName,
                        autoDestroy : true,
                        scrollable  : true,
                        layout : 'fit',
                        items : [Ext.create('vegl.widgets.CodeEditorField', {
                            title : 'Script Source',
                            mode : 'text/plain',
                            showAutoIndent : false,
                            showLineNumbers : true,
                            readOnly : true,
                            listModes : [{text: "Plain text", mime: "text/plain"}],
                            value : sections[sectionName],
                            modes: [{
                                mime:           ['text/plain'],
                                dependencies:   []
                            }]
                        })]
                    });
                }

                //Add our components and select the python tab (if it exists, otherwise use the 'Full' tab)
                if (components.length > 0) {
                    this.add(components);
                    if (!this.setActiveTab('Python')) {
                        this.setActiveTab('Full');
                    }
                } else {
                    this.clearLogs();
                    this.addEmptyTab('The selected job hasn\'t recorded any logs yet.');
                }
            }
        });
    },

    /**
     * Removes logs from this panel. Optionally adds a replacement tab indicating this panel is empty
     */
    clearLogs : function(addEmptyTab) {
        this.currentJob = null;
        this.removeAll(true);
        if (addEmptyTab) {
            this.addEmptyTab('No job selected.');
        }
        this.doLayout();
    },

    /**
     * Adds an empty tab with the specified text to this panel
     */
    addEmptyTab : function(text) {
        this.add({
            autoDestroy : true,
            html : Ext.util.Format.format('<p class="centeredlabel">{0}</p>', text)
        });
    }
});