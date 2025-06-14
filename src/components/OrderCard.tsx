import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Clock, User as UserIcon, Package, FileText, Tag, Eye } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { type Order, type User } from '../types';
import { assignOrder, completeOrder, updateOrderRemarks, updateProductCustomizations, getProductLabels } from '../utils/storage';
import { useMobileView } from './Dashboard';

interface OrderCardProps {
  order: Order;
  currentUser: User;
  florists: User[];
  onOrderUpdate: () => void;
  isBatchMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (orderId: string) => void;
}

export function OrderCard({ order, currentUser, florists, onOrderUpdate, isBatchMode = false, isSelected = false, onToggleSelection }: OrderCardProps) {
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [remarksValue, setRemarksValue] = useState(order.remarks || '');
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productCustomizationsValue, setProductCustomizationsValue] = useState(order.productCustomizations || '');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Get mobile view context to force mobile styling when toggle is active
  const { isMobileView } = useMobileView();

  const assignedFlorist = florists.find(f => f.id === order.assignedFloristId);
  const canAssignSelf = currentUser.role === 'florist' && !order.assignedFloristId;
  const isAdmin = currentUser.role === 'admin';
  const isAssigned = order.assignedFloristId && order.status !== 'completed';
  const isCompleted = order.status === 'completed';

  // Get the label for this order's difficulty
  const labels = getProductLabels();
  const currentLabel = labels.find(label => label.name === order.difficultyLabel);

  const justOpenedEdit = useRef(false);

  // Mock function to get product image - will be replaced with Shopify integration
  const getProductImage = () => {
    // For now, return a placeholder image based on product type
    const productType = order.productTypeLabel?.toLowerCase() || 'bouquet';
    const imageMap: { [key: string]: string } = {
      'bouquet': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400&h=400&fit=crop&crop=center',
      'vase': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=400&fit=crop&crop=center',
      'arrangement': 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop&crop=center',
      'centerpiece': 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=400&fit=crop&crop=center',
      'corsage': 'https://images.unsplash.com/photo-1582793988951-9e6c4c0e8a5c?w=400&h=400&fit=crop&crop=center',
      'boutonniere': 'https://images.unsplash.com/photo-1582793988951-9e6c4c0e8a5c?w=400&h=400&fit=crop&crop=center'
    };
    
    return imageMap[productType] || imageMap['bouquet'];
  };

  const handleAssignSelf = () => {
    assignOrder(order.id, currentUser.id);
    onOrderUpdate();
    toast.success(`Order ${order.id} assigned to you successfully!`, {
      description: `${order.productName} - ${order.timeslot}`
    });
  };

  const handleAdminAssign = (floristId: string) => {
    const assignedFlorist = florists.find(f => f.id === floristId);
    const floristName = assignedFlorist ? assignedFlorist.name : 'Unassigned';
    
    assignOrder(order.id, floristId);
    onOrderUpdate();
    
    if (floristId === 'unassigned') {
      toast.info(`Order ${order.id} unassigned`, {
        description: `${order.productName} - ${order.timeslot}`
      });
    } else {
      toast.success(`Order ${order.id} assigned to ${floristName}`, {
        description: `${order.productName} - ${order.timeslot}`
      });
    }
  };

  const handleToggleComplete = () => {
    completeOrder(order.id);
    onOrderUpdate();
    
    if (order.status === 'completed') {
      toast.info(`Order ${order.id} marked as incomplete`, {
        description: `${order.productName} - ${order.timeslot}`
      });
    } else {
      toast.success(`Order ${order.id} completed!`, {
        description: `${order.productName} - ${order.timeslot}`
      });
    }
  };

  const handleRemarksSubmit = () => {
    updateOrderRemarks(order.id, remarksValue);
    setIsEditingRemarks(false);
    onOrderUpdate();
  };

  const handleRemarksCancel = () => {
    setRemarksValue(order.remarks || '');
    setIsEditingRemarks(false);
  };

  const handleProductCustomizationsSubmit = () => {
    updateProductCustomizations(order.id, productCustomizationsValue);
    setIsEditingProduct(false);
    onOrderUpdate();
  };

  const handleProductCustomizationsCancel = () => {
    setProductCustomizationsValue(order.productCustomizations || '');
    setIsEditingProduct(false);
  };

  const handleCheckboxChange = () => {
    if (onToggleSelection) {
      onToggleSelection(order.id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (justOpenedEdit.current) {
      justOpenedEdit.current = false;
      return;
    }
    // Don't toggle if clicking on interactive elements or if any input/textarea/select is focused
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button') || 
                         target.closest('input') || 
                         target.closest('select') || 
                         target.closest('textarea') ||
                         target.closest('[role="button"]') ||
                         target.closest('.select-trigger') ||
                         target.closest('.select-content') ||
                         target.closest('.checkbox') ||
                         target.closest('.dialog') ||
                         target.closest('.modal') ||
                         target.closest('[data-interactive]');

    // Prevent collapse if any input, textarea, or select inside the card is focused
    const cardElement = e.currentTarget as HTMLElement;
    const activeElement = document.activeElement;
    if (
      isInteractive ||
      (activeElement && cardElement.contains(activeElement) &&
        (activeElement.tagName === 'INPUT' ||
         activeElement.tagName === 'TEXTAREA' ||
         activeElement.tagName === 'SELECT'))
    ) {
      return;
    }
    setIsCollapsed(!isCollapsed);
  };

  // Determine card background color based on status
  const getCardClassName = () => {
    if (isCompleted) {
      return 'mb-4 bg-green-50 border-green-200 border-l-4 border-l-green-500';
    }
    if (isAssigned) {
      return 'mb-4 bg-blue-50 border-blue-200 border-l-4 border-l-blue-500';
    }
    return 'mb-4 border-l-4 border-l-orange-500'; // Default/original look for pending/unassigned
  };

  return (
    <Card 
      className={`${getCardClassName()} cursor-pointer hover:shadow-md transition-all duration-200`}
      onClick={handleCardClick}
    >
      <CardContent className={`${isMobileView ? 'p-2' : 'p-3'}`}>
        {isMobileView ? (
          /* Mobile Compact Horizontal Scrollable Layout */
          <div className="space-y-2">
            {isCollapsed ? (
              /* Collapsed View - Only Product Title, Variant, and Checkbox */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isBatchMode && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={handleCheckboxChange}
                      className="h-3 w-3 flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {order.productName}
                    </div>
                    {order.productVariant && (
                      <div className="text-xs text-gray-600 italic truncate">
                        {order.productVariant}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    (Click to expand)
                  </span>
                </div>
              </div>
            ) : (
              /* Expanded View - Full Details */
              <>
                {/* Header Row - Order ID and Complete Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {isBatchMode && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={handleCheckboxChange}
                        className="h-3 w-3"
                      />
                    )}
                    <Package className="h-3 w-3 text-gray-500" />
                    <span className="text-xs font-mono text-gray-700 font-medium">#{order.id}</span>
                    <span className="text-xs text-gray-400 ml-1">
                      (Click to collapse)
                    </span>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={handleToggleComplete}
                    className={`h-6 w-6 rounded-full p-0 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-green-600 shadow-lg hover:bg-green-700'
                        : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                    }`}
                    aria-label={isCompleted ? 'Mark order as incomplete' : 'Mark order as completed'}
                  >
                    <Check className="h-3 w-3 text-white" />
                  </Button>
                </div>

                {/* Product Name with Customizations */}
                <div className="text-sm font-medium text-gray-900">
                  <div className="leading-snug">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide whitespace-nowrap pb-1">
                      <span>{order.productName}</span>
                      <button
                        onClick={() => setShowImagePreview(true)}
                        className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label="View product image"
                      >
                        <Eye className="h-3 w-3 text-gray-500 hover:text-blue-600" />
                      </button>
                    </div>
                  </div>
                  {order.productVariant && (
                    <div className="text-xs text-gray-600 italic mt-1 leading-snug overflow-x-auto scrollbar-hide whitespace-nowrap pb-1">
                      {order.productVariant}
                    </div>
                  )}
                  {order.productCustomizations && (
                    <div className="text-xs text-blue-700 font-normal mt-1 leading-snug">
                      {order.productCustomizations}
                    </div>
                  )}
                </div>

                {/* Essential Info Row - Always Visible */}
                <div className={`grid gap-4 text-xs ${order.deliveryType ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {/* Timeslot */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600 font-medium">Timeslot</span>
                    </div>
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {order.timeslot}
                    </Badge>
                  </div>

                  {/* Delivery Type */}
                  {order.deliveryType && (
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Package className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600 font-medium">Type</span>
                      </div>
                      <Badge 
                        className={`text-xs px-2 py-1 text-white ${
                          order.deliveryType === 'express' 
                            ? 'bg-red-500' 
                            : order.deliveryType === 'collection'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}
                      >
                        {order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1)}
                      </Badge>
                    </div>
                  )}

                  {/* Assignment */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <UserIcon className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600 font-medium">Florist</span>
                    </div>
                    {isAdmin ? (
                      <Select
                        value={order.assignedFloristId || 'unassigned'}
                        onValueChange={handleAdminAssign}
                        disabled={isCompleted}
                      >
                        <SelectTrigger className={`h-7 text-sm w-full ${
                          order.assignedFloristId === currentUser.id 
                            ? 'bg-yellow-100 border-yellow-300 text-yellow-800 font-semibold' 
                            : ''
                        }`} onClick={e => e.stopPropagation()} onFocus={e => e.stopPropagation()}>
                          <SelectValue placeholder="Assign" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {florists
                            .filter(florist => florist.id && florist.id.trim() !== '')
                            .map(florist => (
                              <SelectItem key={florist.id} value={florist.id}>
                                {florist.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div>
                        {assignedFlorist ? (
                          <Badge 
                            variant={assignedFlorist.id === currentUser.id ? "default" : "secondary"} 
                            className={`text-sm px-2 py-1 ${
                              assignedFlorist.id === currentUser.id 
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-semibold' 
                                : ''
                            }`}
                          >
                            {assignedFlorist.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details - Only Show When Not Collapsed */}
                <>
                  {/* Difficulty Card */}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <div className="flex-shrink-0 bg-gray-50 rounded px-2 py-1 min-w-fit">
                      <div className="flex items-center gap-1">
                        <Tag className="h-2 w-2 text-gray-500" />
                        <span className="text-[10px] text-gray-600">Difficulty</span>
                      </div>
                      {currentLabel ? (
                        <div 
                          className="text-[10px] font-medium px-1 rounded text-white mt-0.5"
                          style={{ backgroundColor: currentLabel.color }}
                        >
                          {currentLabel.name}
                        </div>
                      ) : (
                        <div className="text-[10px] font-medium text-gray-700 mt-0.5">
                          {order.difficultyLabel}
                        </div>
                      )}
                    </div>

                    {/* Remarks Card (if any) */}
                    {order.remarks && (
                      <div className="flex-shrink-0 bg-gray-50 rounded px-2 py-1 min-w-fit">
                        <div className="flex items-center gap-1">
                          <FileText className="h-2 w-2 text-gray-500" />
                          <span className="text-[10px] text-gray-600">Note</span>
                        </div>
                        <div className="text-[10px] font-medium text-gray-700 mt-0.5 max-w-20 truncate">
                          {order.remarks}
                        </div>
                      </div>
                    )}

                    {/* Action Cards */}
                    {canAssignSelf && !isCompleted && (
                      <div className="flex-shrink-0">
                        <button 
                          onClick={handleAssignSelf}
                          className="bg-green-100 text-green-700 rounded px-2 py-1 text-[10px] font-medium hover:bg-green-200 transition-colors"
                        >
                          Assign Me
                        </button>
                      </div>
                    )}
                  </div>
                </>
              </>
            )}
          </div>
        ) : (
          /* Desktop Layout - More Concise */
          <div className="space-y-3">
            {isCollapsed ? (
              /* Collapsed View - Only Product Title, Variant, and Checkbox */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isBatchMode && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={handleCheckboxChange}
                      className="h-4 w-4 flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {order.productName}
                    </div>
                    {order.productVariant && (
                      <div className="text-xs text-gray-600 italic truncate">
                        {order.productVariant}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    (Click to expand)
                  </span>
                </div>
              </div>
            ) : (
              /* Expanded View - Full Details */
              <>
                {/* Header Row - Order ID and Complete Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isBatchMode && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={handleCheckboxChange}
                        className="h-4 w-4"
                      />
                    )}
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-mono text-gray-700 font-medium">#{order.id}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      (Click to collapse)
                    </span>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={handleToggleComplete}
                    className={`h-8 w-8 rounded-full p-0 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-green-600 shadow-lg hover:bg-green-700'
                        : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                    }`}
                    aria-label={isCompleted ? 'Mark order as incomplete' : 'Mark order as completed'}
                  >
                    <Check className="h-4 w-4 text-white" />
                  </Button>
                </div>

                {/* Product Information - Compact */}
                <div>
                  {isEditingProduct ? (
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900 text-sm">
                        {order.productName}
                        {order.productVariant && (
                          <span className="text-gray-600 ml-2 text-xs">({order.productVariant})</span>
                        )}
                      </div>
                      <Textarea
                        value={productCustomizationsValue}
                        onChange={(e) => setProductCustomizationsValue(e.target.value)}
                        placeholder="Add customizations or special instructions..."
                        className="text-sm min-h-[60px] resize-none"
                        onClick={e => e.stopPropagation()}
                        onFocus={e => e.stopPropagation()}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleProductCustomizationsSubmit}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleProductCustomizationsCancel}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`${
                        isAdmin && !isCompleted ? 'cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors border border-dashed border-gray-200 hover:border-gray-300' : 'p-2'
                      }`}
                      onClick={e => {
                        if (isAdmin && !isCompleted) {
                          e.stopPropagation();
                          justOpenedEdit.current = true;
                          setIsEditingProduct(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (isAdmin && !isCompleted && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          setIsEditingProduct(true);
                        }
                      }}
                      tabIndex={isAdmin && !isCompleted ? 0 : -1}
                      role={isAdmin && !isCompleted ? 'button' : undefined}
                    >
                      <div className="font-medium text-gray-900 text-sm leading-tight">
                        <div className="flex items-center gap-2">
                          <span>
                            {order.productName}
                            {order.productVariant && (
                              <span className="text-gray-600 ml-2 text-xs">({order.productVariant})</span>
                            )}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowImagePreview(true);
                            }}
                            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                            aria-label="View product image"
                          >
                            <Eye className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                          </button>
                        </div>
                      </div>
                      {order.productCustomizations && (
                        <div className="text-xs text-blue-700 mt-1 bg-blue-50 p-2 rounded border border-blue-200">
                          <div className="flex items-start gap-1">
                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <div>{order.productCustomizations}</div>
                          </div>
                        </div>
                      )}
                      {isAdmin && !isCompleted && !order.productCustomizations && (
                        <div className="text-xs text-gray-400 italic mt-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Click to add customizations
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Essential Info Row - Always Visible */}
                <div className={`grid gap-4 text-xs ${order.deliveryType ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {/* Timeslot */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600 font-medium">Timeslot</span>
                    </div>
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {order.timeslot}
                    </Badge>
                  </div>

                  {/* Delivery Type */}
                  {order.deliveryType && (
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Package className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600 font-medium">Type</span>
                      </div>
                      <Badge 
                        className={`text-xs px-2 py-1 text-white ${
                          order.deliveryType === 'express' 
                            ? 'bg-red-500' 
                            : order.deliveryType === 'collection'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}
                      >
                        {order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1)}
                      </Badge>
                    </div>
                  )}

                  {/* Assignment */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <UserIcon className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600 font-medium">Florist</span>
                    </div>
                    {isAdmin ? (
                      <Select
                        value={order.assignedFloristId || 'unassigned'}
                        onValueChange={handleAdminAssign}
                        disabled={isCompleted}
                      >
                        <SelectTrigger className={`h-7 text-sm w-full ${
                          order.assignedFloristId === currentUser.id 
                            ? 'bg-yellow-100 border-yellow-300 text-yellow-800 font-semibold' 
                            : ''
                        }`} onClick={e => e.stopPropagation()} onFocus={e => e.stopPropagation()}>
                          <SelectValue placeholder="Assign" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {florists
                            .filter(florist => florist.id && florist.id.trim() !== '')
                            .map(florist => (
                              <SelectItem key={florist.id} value={florist.id}>
                                {florist.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div>
                        {assignedFlorist ? (
                          <Badge 
                            variant={assignedFlorist.id === currentUser.id ? "default" : "secondary"} 
                            className={`text-sm px-2 py-1 ${
                              assignedFlorist.id === currentUser.id 
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-semibold' 
                                : ''
                            }`}
                          >
                            {assignedFlorist.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details - Only Show When Not Collapsed */}
                <>
                  {/* Difficulty Row */}
                  <div className="grid grid-cols-1 gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Tag className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600 font-medium">Difficulty</span>
                      </div>
                      {currentLabel ? (
                        <Badge 
                          style={{ backgroundColor: currentLabel.color, color: 'white' }}
                          className="text-white text-xs px-2 py-1"
                        >
                          {currentLabel.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          {order.difficultyLabel}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Remarks and Actions Row */}
                  <div className="flex gap-3 items-start">
                    {/* Remarks - takes most space */}
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600 font-medium">Remarks</span>
                      </div>
                      {isEditingRemarks ? (
                        <div className="space-y-2">
                          <Input
                            value={remarksValue}
                            onChange={(e) => setRemarksValue(e.target.value)}
                            placeholder="Add remarks..."
                            className="text-xs h-8"
                            onClick={e => e.stopPropagation()}
                            onFocus={e => e.stopPropagation()}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleRemarksSubmit} className="h-7 text-xs">
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleRemarksCancel} className="h-7 text-xs">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`text-xs ${order.remarks ? 'text-gray-700' : 'text-gray-400'} ${
                            isAdmin && !isCompleted ? 'cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors border border-dashed border-gray-200 hover:border-gray-300' : 'p-2 bg-gray-50 rounded'
                          } break-words leading-tight min-h-[32px] flex items-center`}
                          onClick={() => isAdmin && !isCompleted && setIsEditingRemarks(true)}
                          onKeyDown={(e) => {
                            if (isAdmin && !isCompleted && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              setIsEditingRemarks(true);
                            }
                          }}
                          tabIndex={isAdmin && !isCompleted ? 0 : -1}
                          role={isAdmin && !isCompleted ? 'button' : undefined}
                        >
                          {order.remarks || (isAdmin && !isCompleted ? 'Click to add remarks...' : 'No remarks')}
                        </div>
                      )}
                    </div>

                    {/* Assign to Me Button */}
                    {canAssignSelf && !isCompleted && (
                      <Button 
                        size="sm" 
                        onClick={e => { e.stopPropagation(); handleAssignSelf(); }}
                        className="bg-green-600 hover:bg-green-700 h-8 text-xs px-3"
                      >
                        <UserIcon className="h-3 w-3 mr-1" />
                        Assign Me
                      </Button>
                    )}
                  </div>
                </>
              </>
            )}
          </div>
        )}
      </CardContent>

      {/* Product Image Preview Dialog */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {order.productName}
              {order.productVariant && (
                <span className="text-gray-600 text-sm font-normal">({order.productVariant})</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <img
                src={getProductImage()}
                alt={`${order.productName} preview`}
                className="w-full h-auto rounded-lg shadow-lg object-cover"
                style={{ maxHeight: '500px' }}
              />
              <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {order.productTypeLabel || 'Product'}
              </div>
            </div>
            
            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Difficulty:</span>
                <div className="mt-1">
                  {currentLabel ? (
                    <Badge 
                      style={{ backgroundColor: currentLabel.color, color: 'white' }}
                      className="text-white text-xs"
                    >
                      {currentLabel.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {order.difficultyLabel}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Timeslot:</span>
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    {order.timeslot}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Customizations if any */}
            {order.productCustomizations && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-blue-900 text-sm mb-1">Customizations</div>
                    <div className="text-blue-800 text-sm">{order.productCustomizations}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Remarks if any */}
            {order.remarks && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-gray-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 text-sm mb-1">Remarks</div>
                    <div className="text-gray-700 text-sm">{order.remarks}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}