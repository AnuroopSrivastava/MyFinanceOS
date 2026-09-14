import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Bug,
  CheckCircle2,
  Palette,
  Wrench,
  LifeBuoy,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { type ChangeCategory, CATEGORY_METADATA } from '@financeos/shared';

export interface CategoryIconProps {
  category: ChangeCategory | string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 15,
  className = '',
  style
}) => {
  const meta = CATEGORY_METADATA[category as ChangeCategory] || CATEGORY_METADATA.Other;
  const tokenColor = `var(${meta.accentToken}, ${meta.fallbackColor})`;

  const iconProps = {
    size,
    color: tokenColor,
    'aria-hidden': true as const,
    className,
    style
  };

  switch (meta.iconName) {
    case 'Sparkles':
      return <Sparkles {...iconProps} />;
    case 'CheckCircle2':
      return <CheckCircle2 {...iconProps} />;
    case 'Bug':
      return <Bug {...iconProps} />;
    case 'Zap':
      return <Zap {...iconProps} />;
    case 'Palette':
      return <Palette {...iconProps} />;
    case 'ShieldCheck':
      return <ShieldCheck {...iconProps} />;
    case 'Wrench':
      return <Wrench {...iconProps} />;
    case 'LifeBuoy':
      return <LifeBuoy {...iconProps} />;
    case 'AlertTriangle':
      return <AlertTriangle {...iconProps} />;
    case 'Tag':
    default:
      return <Tag {...iconProps} />;
  }
};

export default CategoryIcon;
