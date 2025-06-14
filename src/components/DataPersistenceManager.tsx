import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Shield,
  HardDrive,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  createDataBackup, 
  restoreDataFromBackup, 
  checkDataIntegrity,
  getUserPreferences,
  saveUserPreferences
} from '../utils/storage';

export function DataPersistenceManager() {
  const [dataIntegrity, setDataIntegrity] = useState<{ isValid: boolean; issues: string[] } | null>(null);
  const [backupData, setBackupData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    available: boolean;
    keys: string[];
  } | null>(null);

  useEffect(() => {
    checkIntegrity();
    getStorageInfo();
  }, []);

  const checkIntegrity = () => {
    const result = checkDataIntegrity();
    setDataIntegrity(result);
  };

  const getStorageInfo = () => {
    try {
      // Get localStorage usage info
      let totalSize = 0;
      const keys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('florist-dashboard-') || key === 'shopify-mapping-config' || key === 'multi-store-webhook-configs') {
          keys.push(key);
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }

      setStorageInfo({
        used: totalSize,
        available: true,
        keys
      });
    } catch (error) {
      setStorageInfo({
        used: 0,
        available: false,
        keys: []
      });
    }
  };

  const handleCreateBackup = () => {
    try {
      const backup = createDataBackup();
      setBackupData(backup);
      toast.success('Backup created successfully');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    }
  };

  const handleDownloadBackup = () => {
    if (!backupData) {
      toast.error('No backup data available. Create a backup first.');
      return;
    }

    try {
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-todo-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Failed to download backup');
    }
  };

  const handleRestoreBackup = () => {
    if (!backupData.trim()) {
      toast.error('Please paste backup data first');
      return;
    }

    if (!confirm('This will overwrite all current data. Are you sure you want to restore from backup?')) {
      return;
    }

    setIsLoading(true);
    try {
      const success = restoreDataFromBackup(backupData);
      if (success) {
        toast.success('Data restored successfully. Please refresh the page.');
        checkIntegrity();
        getStorageInfo();
      } else {
        toast.error('Failed to restore data. Please check the backup format.');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Failed to restore backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setBackupData(content);
      toast.success('Backup file loaded successfully');
    };
    reader.onerror = () => {
      toast.error('Failed to read backup file');
    };
    reader.readAsText(file);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const enableAutoPersistence = () => {
    const preferences = getUserPreferences();
    preferences.autoPersistence = true;
    saveUserPreferences(preferences);
    toast.success('Auto-persistence enabled');
  };

  return (
    <div className="space-y-6">
      {/* Data Integrity Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Integrity Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {dataIntegrity?.isValid ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <Badge variant="default" className="bg-green-100 text-green-800">
                  All Data Valid
                </Badge>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <Badge variant="destructive">
                  {dataIntegrity?.issues.length || 0} Issues Found
                </Badge>
              </>
            )}
            <Button
              onClick={checkIntegrity}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recheck
            </Button>
          </div>

          {dataIntegrity?.issues && dataIntegrity.issues.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="font-medium text-amber-800 mb-2">Issues Found:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                {dataIntegrity.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Storage Used</p>
              <p className="text-lg font-semibold">
                {storageInfo ? formatBytes(storageInfo.used) : 'Calculating...'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Storage Available</p>
              <p className="text-lg font-semibold">
                {storageInfo?.available ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-red-600">No</span>
                )}
              </p>
            </div>
          </div>

          {storageInfo && storageInfo.keys.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Data Keys ({storageInfo.keys.length})</p>
              <div className="flex flex-wrap gap-1">
                {storageInfo.keys.map((key) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key.replace('florist-dashboard-', '')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup & Restore
          </CardTitle>
          <p className="text-sm text-gray-600">
            Create backups of your data to prevent loss and restore from previous backups
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleCreateBackup} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
            <Button 
              onClick={handleDownloadBackup} 
              disabled={!backupData}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Backup
            </Button>
            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="backup-upload"
              />
              <Button 
                onClick={() => document.getElementById('backup-upload')?.click()}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Load Backup File
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Backup Data (JSON)
            </label>
            <Textarea
              value={backupData}
              onChange={(e) => setBackupData(e.target.value)}
              placeholder="Paste backup JSON data here or create/load a backup..."
              rows={6}
              className="font-mono text-xs"
            />
          </div>

          <Button 
            onClick={handleRestoreBackup}
            disabled={!backupData.trim() || isLoading}
            variant="destructive"
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Restore from Backup
          </Button>
        </CardContent>
      </Card>

      {/* Persistence Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Persistence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-800">Persistence Active</h4>
            </div>
            <p className="text-sm text-green-700">
              Your data is automatically saved to browser storage and will persist across page refreshes and browser sessions.
            </p>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>What's Persisted:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Store configurations and webhook settings</li>
              <li>Orders, products, and florist assignments</li>
              <li>Product labels and customizations</li>
              <li>Shopify API configurations</li>
              <li>User preferences and settings</li>
              <li>Authentication state</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Tips for Data Safety</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Create regular backups of your important data</li>
              <li>• Download backups before major changes</li>
              <li>• Keep backups in a safe location</li>
              <li>• Test restore functionality periodically</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 